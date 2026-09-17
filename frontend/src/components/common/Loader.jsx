const Loader = ({ full = false, text = 'Loading...' }) => {
  if (full) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3 text-muted mb-0">{text}</p>
      </div>
    );
  }
  return (
    <div className="text-center py-4">
      <div className="spinner-border text-primary spinner-border-sm" role="status" />
    </div>
  );
};

export default Loader;
