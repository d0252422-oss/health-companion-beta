// CLIP-only adapter over unmodified @huggingface/transformers 4.3.2 source.
// Mirrors the upstream EncoderOnly session + encoder_forward CLIP path, and
// ZeroShotImageClassificationPipeline CLIP scoring path. No generation runtime.
import { AutoConfig } from './node_modules/@huggingface/transformers/src/configs.js';
import { constructSessions, sessionRun } from './node_modules/@huggingface/transformers/src/models/session.js';
import { CLIPTokenizer } from './node_modules/@huggingface/transformers/src/models/clip/tokenization_clip.js';
import { CLIPImageProcessor } from './node_modules/@huggingface/transformers/src/models/clip/image_processing_clip.js';
import { pick } from './node_modules/@huggingface/transformers/src/utils/core.js';
import { softmax } from './node_modules/@huggingface/transformers/src/utils/maths.js';
export { RawImage } from './node_modules/@huggingface/transformers/src/utils/image.js';
export { env } from './node_modules/@huggingface/transformers/src/env.js';

const MODEL = 'Xenova/clip-vit-base-patch32';
const REVISION = '6b7c523703ae26e39be4b03774966f8571c7f523';
async function createCLIPSession(options) {
  const config = await AutoConfig.from_pretrained(MODEL, options);
  if (config.model_type !== 'clip' || config.architectures?.length !== 1 || config.architectures[0] !== 'CLIPModel') {
    throw Error('UNSUPPORTED_MODEL_CONFIG');
  }
  // Same default sessions/options selected by upstream CLIPModel EncoderOnly.
  const { model: session } = await constructSessions(MODEL, { model: 'model' }, {
    ...options, config, subfolder: 'onnx', session_options: {},
  });
  // CLIP needs no embeddings, token-type-id or pixel-mask synthesis performed
  // for other encoders. Reject such graphs instead of generalizing this adapter.
  const allowed = new Set(['input_ids', 'attention_mask', 'pixel_values']);
  if (!session.inputNames.includes('input_ids') || !session.inputNames.includes('pixel_values') ||
      session.inputNames.some(name => !allowed.has(name))) {
    await session.release?.();
    throw Error('UNSUPPORTED_CLIP_INPUTS');
  }
  return session;
}
export async function createCLIPClassifier({ progress_callback } = {}) {
  const options = { revision: REVISION, dtype: 'q8', device: 'wasm', progress_callback };
  const [session, tokenizer, processor] = await Promise.all([
    createCLIPSession(options),
    CLIPTokenizer.from_pretrained(MODEL, options),
    CLIPImageProcessor.from_pretrained(MODEL, options),
  ]);
  const classify = async (image, candidate_labels) => {
    const texts = candidate_labels.map(label => `This is a photo of ${label}`);
    const text_inputs = tokenizer(texts, { padding: true, truncation: true });
    const { pixel_values } = await processor([image]);
    const inputs = pick({ ...text_inputs, pixel_values }, session.inputNames);
    const output = await sessionRun(session, inputs);
    const probs = softmax(output.logits_per_image[0].data);
    return Array.from(probs, (score, i) => ({ score, label: candidate_labels[i] }))
      .sort((a, b) => b.score - a.score);
  };
  classify.dispose = () => session.release?.();
  return classify;
}
