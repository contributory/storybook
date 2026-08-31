'use client';

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface Storyverse {
  id: string;
  title: string;
  description: string;
  author: string;
  created_at: string;
  storybook_list?: any[];
  comments_count?: number;
  likes_count?: number;
  thumbnail_url?: string;
  characters?: string;
}

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

interface StoryversesPageProps {
  verses: Storyverse[];
  user: any | null;
  totalPages: number;
  currentPage: number;
  isCreator: boolean;
}

export function StoryversesPage({ verses, user, totalPages, currentPage, isCreator }: StoryversesPageProps) {
  const { toggleLike } = useAuth();

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10 max-w-4xl mx-auto text-left">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Vũ Trụ Cốt Truyện</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Các vũ trụ cốt truyện (Storyverses) là nơi kết nối nhiều bộ truyện và chia sẻ chung một dàn nhân vật phong phú.
          </p>
        </div>
        {isCreator && (
          <Link 
            href="/create/storyverse"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 hover:brightness-110 transition-all flex items-center space-x-1.5 flex-shrink-0"
          >
            <i className="fa-solid fa-earth-asia"></i>
            <span>Tạo vũ trụ mới</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {verses.length === 0 ? (
          <div className="col-span-full p-10 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <i className="fa-solid fa-earth-asia text-gray-500 text-3xl mb-3"></i>
            <p className="text-sm text-gray-500 dark:text-gray-500">Chưa có vũ trụ nào được tạo.</p>
          </div>
        ) : (
          verses.map(sv => (
            <div 
              key={sv.id}
              className="p-6 bg-white dark:bg-[#161925]/60 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-4 text-left shadow-lg"
            >
              <div className="space-y-1">
                <Link href={`/storyverses/${sv.id}`}>
                  <h3 className="text-2xl font-bold text-amber-400 hover:underline">{sv.title}</h3>
                </Link>
                <span className="text-xs text-gray-500 dark:text-gray-500 block">
                  Sáng lập bởi: <Link href={`/profile/${sv.author}`} className="hover:text-amber-400 hover:underline">@{sv.author}</Link>
                </span>
              </div>

              <div className="md text-sm leading-relaxed">
                {renderMarkdown(sv.description)}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800/80 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">
                  <i className="fa-solid fa-calendar mr-1.5"></i> {new Date(sv.created_at).toLocaleDateString('vi-VN')}
                </span>
                <div className="flex space-x-4">
                  <button onClick={() => toggleLike('storyverse', sv.id)} className="hover:text-red-400 transition-colors flex items-center space-x-1">
                    <i className="fa-regular fa-heart"></i>
                    <span>{sv.likes_count || 0}</span>
                  </button>
                  <span>
                    <i className="fa-solid fa-comments mr-1"></i> {sv.comments_count || 0}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/storyverses" />
    </>
  );
}

interface StoryverseDetailProps {
  storyverse: Storyverse;
  characters: Character[];
  user: any | null;
  isCreator: boolean;
}

export function StoryverseDetail({ storyverse: sv, characters, user, isCreator }: StoryverseDetailProps) {
  const { toggleLike } = useAuth();

  const deleteUniverse = async (universeId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn vũ trụ này? Các bộ truyện thuộc vũ trụ sẽ mất liên kết.')) return;
    try {
      const res = await fetch(`/api/storyverses/${universeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/storyverses';
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể xóa.'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCharacter = async (charId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn nhân vật này?')) return;
    try {
      const res = await fetch(`/api/characters/${charId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể xóa.'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      {/* Header */}
      <div className="p-8 bg-gradient-to-tr from-white dark:from-[#161925] via-[#10131f] to-amber-900/10 border border-gray-200 dark:border-gray-800 rounded-3xl relative flex flex-col md:flex-row gap-6">
        {sv.thumbnail_url && (
          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800 flex-shrink-0">
            <img src={sv.thumbnail_url} className="w-full h-full object-cover" alt={sv.title} />
          </div>
        )}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-4">
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md text-xs font-semibold">
              <i className="fa-solid fa-earth-asia mr-1"></i> Vũ trụ cốt truyện
            </span>
            <div className="flex flex-col space-y-2 items-end flex-shrink-0">
              <button 
                onClick={() => toggleLike('storyverse', sv.id)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all"
              >
                <i className="fa-regular fa-heart"></i>
                <span>{sv.likes_count || 0} thích</span>
              </button>
              {isCreator && (
                <Link 
                  href={`/create/character?storyverse_id=${sv.id}`}
                  className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 hover:text-black text-amber-400 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  <span>Tạo nhân vật</span>
                </Link>
              )}
              {user && (sv.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner) && (
                <>
                  <Link 
                    href={`/create/storyverse?id=${sv.id}`}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    <span>Sửa vũ trụ</span>
                  </Link>
                  <button 
                    onClick={() => deleteUniverse(sv.id)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:text-black text-red-400 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Xóa vũ trụ</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-4 mb-2">{sv.title}</h1>
          <p className="text-sm text-gray-650 dark:text-gray-400 font-medium">
            Sáng tạo bởi: <Link href={`/profile/${sv.author}`} className="text-gray-805 dark:text-gray-200 hover:text-amber-400 hover:underline">@{sv.author}</Link> &bull; {new Date(sv.created_at).toLocaleDateString('vi-VN')}
          </p>
          <div className="md text-base mt-4 leading-relaxed">
            {renderMarkdown(sv.description)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Books in Universe */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            <i className="fa-solid fa-book mr-2 text-amber-500"></i> Các bộ truyện liên quan
          </h2>
          {sv.storybook_list && sv.storybook_list.length > 0 ? (
            <div className="space-y-3">
              {sv.storybook_list.map(b => (
                <div 
                  key={b.id}
                  className="block p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all"
                >
                  <h4 className="font-bold text-gray-850 dark:text-gray-200 hover:text-amber-400 transition-colors">
                    <Link href={`/storybook/${b.id}`}>{b.title}</Link>
                  </h4>
                  <span className="text-xs text-gray-600 dark:text-gray-400 block mt-1">
                    Tác giả:
                    {b.authors.split(',').map((auth: string, idx: number) => {
                      const a = auth.trim();
                      return (
                        <span key={idx}>
                          <Link href={`/profile/${a}`} className="hover:underline text-amber-500 font-semibold">@{a}</Link>
                          {idx < b.authors.split(',').length - 1 ? ', ' : ''}
                        </span>
                      );
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có truyện nào thuộc vũ trụ này.</p>
          )}
        </div>

        {/* Characters in Universe */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            <i className="fa-solid fa-users mr-2 text-amber-500"></i> Nhân Vật
          </h2>
          {characters && characters.length > 0 ? (
            <div className="space-y-3">
              {characters.map(c => {
                const canEditChar = user && (c.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner);
                return (
                  <div 
                    key={c.id}
                    className="p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-xl flex gap-4"
                  >
                    {c.thumbnail_url && (
                      <img 
                        src={c.thumbnail_url} 
                        className="w-12 h-12 object-cover rounded-xl shadow border border-gray-200 dark:border-gray-800 flex-shrink-0" 
                        alt={c.name}
                      />
                    )}
                    <div className="flex-grow text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-amber-400">{c.name}</h4>
                        <div className="flex items-center space-x-2">
                          {canEditChar && (
                            <>
                              <Link 
                                href={`/create/character?id=${c.id}`}
                                className="p-1 text-gray-500 hover:text-amber-500 transition-colors" 
                                title="Sửa nhân vật"
                              >
                                <i className="fa-solid fa-user-pen"></i>
                              </Link>
                              <button 
                                onClick={() => deleteCharacter(c.id)}
                                className="p-1 text-gray-500 hover:text-red-400 transition-colors" 
                                title="Xóa nhân vật"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-500 block">
                        Tạo bởi: <Link href={`/profile/${c.author}`} className="hover:text-amber-400 hover:underline">@{c.author}</Link>
                      </span>
                      <div className="md text-xs mt-2">
                        {renderMarkdown(c.description)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có nhân vật nào trong vũ trụ này.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function renderMarkdown(text: string): React.JSX.Element {
  // Simple markdown rendering - can be enhanced with a library like react-markdown
  const lines = text.split('\n');
  return (
    <div className="markdown-content">
      {lines.map((line, idx) => {
        if (line.startsWith('# ')) return <h1 key={idx} className="text-2xl font-bold mb-2">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={idx} className="text-xl font-bold mb-2">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={idx} className="text-lg font-bold mb-2">{line.slice(4)}</h3>;
        if (line.startsWith('- ')) return <li key={idx} className="ml-4">{line.slice(2)}</li>;
        if (line.trim() === '') return <br key={idx} />;
        return <p key={idx} className="mb-2">{line}</p>;
      })}
    </div>
  );
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
