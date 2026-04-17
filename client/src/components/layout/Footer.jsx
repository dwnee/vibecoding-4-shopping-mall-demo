import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          <div>
            <h3 className="text-white font-black tracking-widest uppercase text-sm mb-4">CIDER</h3>
            <p className="text-xs leading-relaxed text-gray-500">
              Express your unique style with our curated collection of trendy fashion pieces.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold tracking-widest uppercase text-xs mb-5">SHOP</h3>
            <ul className="space-y-3 text-xs">
              <li><Link to="/products" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Clothing</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Accessories</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors text-red-400 hover:text-red-300">Sale</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold tracking-widest uppercase text-xs mb-5">SUPPORT</h3>
            <ul className="space-y-3 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Order Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold tracking-widest uppercase text-xs mb-5">CONNECT</h3>
            <ul className="space-y-3 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition-colors">TikTok</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pinterest</a></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} CIDER. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
