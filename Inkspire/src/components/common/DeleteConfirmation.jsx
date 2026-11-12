function DeleteConfirmation({ itemName, error, isDeleting, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirmation-title"
    >
      <div className="w-full max-w-md rounded-[1.75rem] bg-paper p-7">
        <h2 id="delete-confirmation-title" className="font-display text-3xl">
          Confirm deletion
        </h2>
        <p className="mt-3 text-ink/60">
          Are you sure you want to delete {itemName}?
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold hover:bg-mist disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmation;
