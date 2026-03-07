export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] overflow-auto bg-white print:static print:z-auto">
      {children}
    </div>
  );
}
