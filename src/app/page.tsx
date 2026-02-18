export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-coral-500">EventTara</h1>
        <p className="text-xl text-gray-600">Tara na! — Book Your Next Adventure</p>
        <div className="flex gap-4 justify-center">
          <button className="btn-primary">Explore Events</button>
          <button className="btn-secondary">List Your Event</button>
        </div>
      </div>
    </main>
  );
}
