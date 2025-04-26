import { Link } from 'wouter';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">WebScanner<span className="text-gray-500 text-xs align-super">v4</span></h3>
            <p className="text-gray-600 text-sm">
              Comprehensive web security scanning and reporting platform with AI-powered insights.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard">
                  <a className="text-gray-600 hover:text-primary text-sm">Dashboard</a>
                </Link>
              </li>
              <li>
                <Link href="/scans">
                  <a className="text-gray-600 hover:text-primary text-sm">Scans</a>
                </Link>
              </li>
              <li>
                <Link href="/scan-wizard">
                  <a className="text-gray-600 hover:text-primary text-sm">New Scan</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy">
                  <a className="text-gray-600 hover:text-primary text-sm">Privacy Policy</a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="text-gray-600 hover:text-primary text-sm">Terms of Service</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} WebScanner. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}