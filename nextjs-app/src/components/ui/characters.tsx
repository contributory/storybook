'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface Character {
  id: string;
  name: string;
  description: string;
  author: string;
  storyverse_id: string;
  created_at: string;
  image_url?: string;
  thumbnail_url?: string;
  comments_count?: number;
  likes_count?: number;
}

interface Storyverse {
  id: string;
  title: string;
  description: string;
  author: string;
  created_at: string;
}

interface CharactersPageProps {
  characters: Character[];
  universes: Storyverse[];
  user: any | null;
  totalPages: number;
  currentPage: number;
  isCreator: boolean;
}

export function CharactersPage({ characters, universes, user, totalPages, currentPage, isCreator }: CharactersPageProps) {
  const { toggleLike } = useAuth();

  const universeTitles = new Map<string, string>();
  universes.forEach(u => universeTitles.set(u.id, u.title));

  return (
    <>
      <div className="space-y-4 text-left max-w-6xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
              <i className="fa-solid fa-users mr-2 text-amber-500"></i> Nhân Vật
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Bộ sưu tập các nhân vật dùng chung được xây dựng trong các vũ trụ cốt truyện.
            </p>
          </div>
          {isCreator && (
            <Link 
              href="/create/character"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 hover:brightness-110 transition-all flex items-center space-x-1.5 flex-shrink-0"
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>Tạo nhân vật mới</span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {characters.length === 0 ? (
          <div className="col-span-full p-10 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <i className="fa-solid fa-user-slash text-gray-500 text-3xl mb-3"></i>
            <p className="text-sm text-gray-500 dark:text-gray-500">Chưa có nhân vật nào được tạo.</p>
          </div>
        ) : (
          characters.map(c => {
            const svTitle = universeTitles.get(c.storyverse_id) || c.storyverse_id;
            return (
              <div 
                key={c.id}
                className="p-6 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700/80 rounded-2xl space-y-4 text-left shadow-lg flex flex-col"
              >
                <div className="flex items-start gap-4">
                  {c.thumbnail_url ? (
                    <img 
                      src={c.thumbnail_url} 
                      className="w-16 h-16 object-cover rounded-2xl shadow border border-gray-200 dark:border-gray-800 flex-shrink-0" 
                      alt={c.name}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/15 to-yellow-400/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-2xl flex-shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{c.name}</h3>
                    <span className="text-[10px] text-gray-500 dark:text-gray-500 block mt-0.5 truncate">
                      <i className="fa-solid fa-earth-asia mr-1 text-amber-500/80"></i>{svTitle}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-500 block mt-0.5">
                      Bởi: <Link href={`/profile/${c.author}`} className="hover:text-amber-400 hover:underline">@{c.author}</Link>
                    </span>
                  </div>
                </div>
                <div className="md text-xs leading-relaxed flex-grow line-clamp-4">
                  {markdownToText(c.description)}
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <Link 
                    href={`/storyverses/${c.storyverse_id}`}
                    className="text-amber-500 hover:underline font-semibold flex items-center space-x-1.5"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    <span>Xem trong vũ trụ</span>
                  </Link>
                  <div className="flex items-center space-x-3">
                    <button onClick={() => toggleLike('character', c.id)} className="hover:text-red-400 transition-colors flex items-center space-x-1">
                      <i className="fa-regular fa-heart mr-1"></i>
                      <span>{c.likes_count || 0}</span>
                    </button>
                    <span>
                      <i className="fa-regular fa-comment mr-1"></i> {c.comments_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/characters" />
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
