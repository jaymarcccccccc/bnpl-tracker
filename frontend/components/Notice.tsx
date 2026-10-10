export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="notice notice-error" role="alert">
      <p>
        <strong>Can&rsquo;t reach the API.</strong> {message}
      </p>
      <p className="muted">
        Check that the backend is running on port 8000 and the database is up.
      </p>
    </div>
  );
}

export function Loading() {
  return <p className="muted">Loading…</p>;
}
