import type { TaskType } from './api';

const TASK_LABELS: Record<TaskType, string> = {
  single_image_vqa: 'Visual Q&A',
  single_image_captioning: 'Scene Captioning',
  change_vqa: 'Change Detection',
  cross_modal_fusion: 'Optical+SAR Fusion',
  text_guided_grounding: 'Region Grounding',
};

export function taskLabel(task: TaskType): string {
  return TASK_LABELS[task] ?? task;
}
