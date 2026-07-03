const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;

  const pageNumbers = [];
  const delta = 2;
  const left = Math.max(1, page - delta);
  const right = Math.min(pages, page + delta);

  for (let i = left; i <= right; i++) pageNumbers.push(i);

  return (
    <nav className="pagination" aria-label="Lead list pagination">
      <button
        className="pagination__btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      {left > 1 && (
        <>
          <button className="pagination__btn" onClick={() => onPageChange(1)}>1</button>
          {left > 2 && <span className="pagination__ellipsis">…</span>}
        </>
      )}

      {pageNumbers.map((n) => (
        <button
          key={n}
          className={`pagination__btn ${n === page ? 'pagination__btn--active' : ''}`}
          onClick={() => onPageChange(n)}
          aria-current={n === page ? 'page' : undefined}
        >
          {n}
        </button>
      ))}

      {right < pages && (
        <>
          {right < pages - 1 && <span className="pagination__ellipsis">…</span>}
          <button className="pagination__btn" onClick={() => onPageChange(pages)}>{pages}</button>
        </>
      )}

      <button
        className="pagination__btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
};

export default Pagination;
