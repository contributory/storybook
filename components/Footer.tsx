// Footer (static, same as previous layout footer)
export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-[#0c0e16] py-8 text-center text-sm text-gray-500 dark:text-gray-500 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-600 dark:text-gray-400">Storybook</span>
          <span>&copy; {new Date().getFullYear()} - AI-supported collaborative storytelling platform</span>
        </div>
        <div className="flex space-x-6">
          <a href="/mcp" className="hover:text-amber-400 transition-colors" target="_blank">
            <i className="fa-solid fa-network-wired mr-1.5"></i> MCP Server
          </a>
        </div>
      </div>
    </footer>
  );
}
