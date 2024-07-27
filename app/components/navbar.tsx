export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 text-white">
      <div>
        <a href="/" className="font-bold text-xl">CareHub</a>
      </div>
      <div>
        <a href="/login" className="mr-4">Login</a>
        <a href="/signup">Sign Up</a>
      </div>
    </nav>
  );
}