function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-ink/20 bg-white/50 px-6 py-12 text-center">
      <Icon className="mx-auto mb-4 h-7 w-7 text-coral" />
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/60">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
