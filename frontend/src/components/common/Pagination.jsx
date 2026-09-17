const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;

  const items = [];
  for (let i = 1; i <= pages; i++) items.push(i);

  return (
    <nav className="mt-4">
      <ul className="pagination justify-content-center">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onChange(page - 1)}>
            Previous
          </button>
        </li>
        {items.map((p) => (
          <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onChange(p)}>
              {p}
            </button>
          </li>
        ))}
        <li className={`page-item ${page === pages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onChange(page + 1)}>
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
