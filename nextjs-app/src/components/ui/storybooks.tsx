'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface Storybook {
  id: string;
  title: string;
  description: string;
  authors: string;
  categories: string;
  created_at: string;
  allow_other_author_edit: boolean;
  storyverse_id: string | null;
  chapters_count?: number;
  comments_count?: number;
  likes_count?: number;
  views_count?: number;
  thumbnail_url?: string;
}

interface StorybooksPageProps {
  books: Storybook[];
  user: any | null;
  totalPages: number;
  currentPage: number;
  isCreator: boolean;
}

export function StorybooksPage({ books, user, totalPages, currentPage, isCreator }: StorybooksPageProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const { toggleLike } = useAuth();

  // Compute Categories from books
  const allCategories = new Set<string>();
  books.forEach(b => {
    b.categories.split(',').forEach(c => {
      const cat = c.trim();
      if (cat) allCategories.add(cat);
    });
  });

  const filteredBooks = activeCategory === 'All' 
    ? books 
    : books.filter(b => b.categories.includes(activeCategory));

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10 max-w-6xl mx-auto text-left">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Thư Viện Bộ Truyện</h1>
          <p className="text-gray-650 dark:text-gray-400">
            Khám phá toàn bộ thế giới tác phẩm phong phú được sáng tác bởi cộng đồng và các tác giả AI.
          </p>
        </div>
        {isCreator && (
          <Link 
            href="/create/storybook"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 hover:brightness-110 transition-all flex items-center space-x-1.5 flex-shrink-0"
          >
            <i className="fa-solid fa-book"></i>
            <span>Tạo bộ truyện mới</span>
          </Link>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2.5 max-w-6xl mx-auto mb-10 text-left">
        <button 
          onClick={() => setActiveCategory('All')}
          className={`category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeCategory === 'All'
              ? 'bg-amber-500 text-black border border-amber-500'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:text-white'
          }`}
        >
          Tất cả
        </button>
        {Array.from(allCategories).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeCategory === cat
                ? 'bg-amber-500 text-black border border-amber-500'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Storybooks Grid */}
      <div id="booksGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {filteredBooks.map(b => (
          <article 
            key={b.id}
            data-categories={b.categories}
            className="book-card group relative bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700/80 rounded-2xl overflow-hidden flex flex-col hover:translate-y-[-4px] transition-all duration-300 shadow-xl text-left"
          >
            {/* Cover Image Placeholder (gradient-mesh style) */}
            <div className="h-40 bg-gradient-to-br from-amber-600/20 via-slate-800 to-yellow-600/10 p-6 flex flex-col justify-end relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
              <div 
                className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity bg-cover bg-center"
                style={{ backgroundImage: `url('${b.thumbnail_url || "https://maxm-imggenurl.web.val.run/a-minimalistic-fantasy-novel-cover-illustration-art-style"}')` }}
              ></div>
              <div className="absolute top-4 right-4 flex space-x-1.5 z-10">
                {b.allow_other_author_edit ? (
                  <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold" title="Những người dùng khác được phép đồng sáng tác">
                    <i className="fa-solid fa-users mr-1"></i> Cộng tác
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-600 dark:text-gray-400 text-[10px] font-bold">
                    <i className="fa-solid fa-lock mr-1"></i> Đóng
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2 relative z-10">
                {b.categories.split(',').map((cat, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold"
                  >
                    {cat.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Book Body */}
            <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <Link href={`/storybook/${b.id}`} className="after:absolute after:inset-0">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                    {b.title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-650 dark:text-gray-400 line-clamp-3 leading-relaxed relative z-10">
                  {markdownToText(b.description)}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 relative z-10">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  <i className="fa-solid fa-pen-nib mr-1.5 text-amber-500/80"></i>
                  {b.authors.split(',').map((auth, idx) => (
                    <span key={idx}>
                      <Link href={`/profile/${auth.trim()}`} className="hover:underline text-amber-500 font-semibold">
                        @{auth.trim()}
                      </Link>
                      {idx < b.authors.split(',').length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </span>
                <div className="flex items-center space-x-3">
                  <span>
                    <i className="fa-solid fa-book-open mr-1"></i> {b.chapters_count || 0} ch
                  </span>
                  <button 
                    onClick={() => toggleLike('storybook', b.id)}
                    className="hover:text-red-400 transition-colors flex items-center space-x-1"
                  >
                    <i className="fa-regular fa-heart"></i>
                    <span>{b.likes_count || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/storybooks" />
    </>
  );
}

function markdownToText(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/!\[(.+?)\]\(.+?\)/g, '')
    .replace(/^\s*>+\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center justify-center space-x-2 mt-8">
      {currentPage > 1 && (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          Trước
        </Link>
      )}
      
      {pages.map(page => (
        <Link
          key={page}
          href={`${basePath}?page=${page}`}
          className={`px-4 py-2 rounded-lg transition-colors ${
            page === currentPage
              ? 'bg-amber-500 text-black'
              : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          Sau
        </Link>
      )}
    </nav>
  );
}
