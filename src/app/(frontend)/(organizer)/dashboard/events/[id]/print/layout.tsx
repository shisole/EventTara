export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Hide everything behind this overlay in print */}
      <style>{`
        @media print {
          /* Hide navbar, sidebar, mobile nav, scanner FAB, breadcrumbs */
          nav, header, aside,
          [data-sidebar], [data-scanner-fab], [data-mobile-nav],
          .no-print { display: none !important; }
          /* Make body and all wrappers transparent so only our content shows */
          body > * { visibility: hidden; }
          body > * #print-content,
          #print-content, #print-content * { visibility: visible; }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      <div
        id="print-content"
        className="fixed inset-0 z-[200] overflow-auto bg-white print:absolute print:inset-0"
      >
        {children}
      </div>
    </>
  );
}
