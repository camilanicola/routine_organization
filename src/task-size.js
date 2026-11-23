const MAX_DOCUMENT_BYTES = 1_048_576;
const DOCUMENT_NAME_RESERVE_BYTES = 6 * 1024;
const encoder = new TextEncoder();

// Tamanhos dos tipos usados nas tarefas, conforme o Firestore:
// https://firebase.google.com/docs/firestore/storage-size
function getValueSize(value) {
  if (typeof value === "string") return encoder.encode(value).byteLength + 1;
  if (typeof value === "number") return 8;
  if (value === null || typeof value === "boolean") return 1;
  if (Array.isArray(value)) {
    return value.reduce((size, item) => size + getValueSize(item), 0);
  }
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.entries(value).reduce((size, [name, item]) => size + getValueSize(name) + getValueSize(item), 32);
  }
  throw new TypeError("Task contains an unsupported field value.");
}

export function validateTaskSize(task) {
  // Reserva o tamanho máximo do nome do documento, independentemente do UID.
  const documentSize = DOCUMENT_NAME_RESERVE_BYTES + getValueSize(task);
  if (documentSize > MAX_DOCUMENT_BYTES) {
    throw new RangeError(task.iconData
      ? "This task is too large to save. Choose a smaller PNG or remove the current icon."
      : "This task is too large to save. Reduce its content.");
  }
}
