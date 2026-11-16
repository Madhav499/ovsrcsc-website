/** Instant skeleton while search results are fetched. */
export default function SearchLoading() {
  return (
    <>
      <div data-mx-hero="dark" className="mx-surface-dark">
        <div className="mx-container mx-hero-offset pb-20">
          <div className="mx-skeleton h-4 w-40" />
          <div className="mx-skeleton mt-14 h-14 w-72 max-w-full" />
          <div className="mx-skeleton mt-10 h-14 w-full max-w-3xl" />
        </div>
      </div>
      <div className="mx-surface-ivory">
        <div className="mx-container mx-section !pt-14" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="grid gap-3 border-t border-(--mx-line) py-7">
              <div className="mx-skeleton h-3 w-20" />
              <div className="mx-skeleton h-6 w-2/3" />
              <div className="mx-skeleton h-4 w-full max-w-xl" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
