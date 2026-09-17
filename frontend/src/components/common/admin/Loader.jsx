export default function Loader({ text = 'Loading...', small = false }) {
  return (
    <div className={`d-flex flex-column align-items-center justify-content-center ${small ? 'py-3' : 'py-5'}`}>
      <div
        className={`spinner-border text-primary ${small ? 'spinner-border-sm' : ''}`}
        role="status"
        aria-hidden="true"
      />
      {text && <p className="text-muted mt-2 mb-0 small">{text}</p>}
    </div>
  );
}
