import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api';
import { getSocket, joinBoardRoom, leaveBoardRoom, emitBoardEvent } from '../../lib/socket';
import { BG_OPTIONS } from '../../lib/constants';
import { getRouterBasename, resolveAppBaseUrl } from '../../lib/runtime';

export default function BoardDetail() {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [myRole, setMyRole] = useState('member');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Post states
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [draggedPostId, setDraggedPostId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [selectedCoverImage, setSelectedCoverImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);

  // Board settings states
  const [isEditBoardOpen, setIsEditBoardOpen] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDesc, setBoardDesc] = useState('');
  const [boardIsActive, setBoardIsActive] = useState(true);
  const [boardAllowPosts, setBoardAllowPosts] = useState(true);
  const [boardBgImage, setBoardBgImage] = useState('default');
  const [showQr, setShowQr] = useState(false);
  const [baseUrl, setBaseUrl] = useState(window.location.origin);

  const socketRef = useRef(null);

  const handleDragStart = (e, postId) => {
    setDraggedPostId(postId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetPostId) => {
    e.preventDefault();
    if (!draggedPostId || draggedPostId === targetPostId) return;

    setPosts(prev => {
      const draggedIndex = prev.findIndex(p => p.id === draggedPostId);
      const targetIndex = prev.findIndex(p => p.id === targetPostId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const newPosts = [...prev];
      const [draggedItem] = newPosts.splice(draggedIndex, 1);
      newPosts.splice(targetIndex, 0, draggedItem);
      return newPosts;
    });
    setDraggedPostId(null);
  };

  const fetchBoard = async () => {
    try {
      const isGuest = !sessionStorage.getItem('token');
      const nickname = sessionStorage.getItem('board_nickname');

      if (isGuest && !nickname) {
        const joinPath = `${getRouterBasename().replace(/\/$/, '')}/join-board`;
        window.location.href = joinPath === '/join-board' ? joinPath : joinPath.replace(/\/+/g, '/');
        return;
      }

      const endpoint = isGuest
        ? `/board/public/${boardId}?nickname=${encodeURIComponent(nickname || '')}`
        : `/board/${boardId}`;

      const data = await apiGet(endpoint);
      if (data.success) {
        setBoard(data.board);
        setBoardTitle(data.board.title);
        setBoardDesc(data.board.description);
        setBoardIsActive(data.board.is_active === 1 || data.board.is_active === true);
        setBoardAllowPosts(data.board.allow_posts === 1 || data.board.allow_posts === true);
        setBoardBgImage(data.board.bg_image || 'default');
        setPosts(data.posts);
        setMembers(data.members || []);
        setMyRole(data.myRole || (isGuest ? 'guest' : 'member'));
      }
    } catch (err) {
      setError(err.message || 'Pano getirilirken hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadBaseUrl = async () => {
      const resolved = await resolveAppBaseUrl();
      setBaseUrl(resolved || window.location.origin);
    };

    loadBaseUrl();

    fetchBoard();

    // Socket.io baglantisi
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isGuest = !sessionStorage.getItem('token');
    const nickname = isGuest ? sessionStorage.getItem('board_nickname') : currentUser.full_name;

    const socket = joinBoardRoom(boardId, nickname);
    socketRef.current = socket;

    socket.on('active-users-updated', (users) => {
      setActiveUsers(users);
    });

    socket.on('post-added', (post) => {
      setPosts(prev => {
        if (prev.find(p => p.id === post.id)) return prev;
        return [post, ...prev];
      });
    });

    socket.on('post-like-updated', ({ postId, likes }) => {
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes, is_liked: p.is_liked } : p
      ));
    });

    socket.on('post-removed', ({ postId }) => {
      setPosts(prev => prev.filter(p => p.id !== postId));
    });

    socket.on('post-updated', (updatedPost) => {
      setPosts(prev => prev.map(p =>
        p.id === updatedPost.id ? { ...p, ...updatedPost, is_liked: p.is_liked } : p
      ));
    });

    socket.on('board-updated', (updatedBoard) => {
      setBoard(prev => ({ ...prev, ...updatedBoard }));
      if (updatedBoard.title) setBoardTitle(updatedBoard.title);
      if (updatedBoard.description !== undefined) setBoardDesc(updatedBoard.description);
      if (updatedBoard.is_active !== undefined) setBoardIsActive(updatedBoard.is_active === 1 || updatedBoard.is_active === true);
      if (updatedBoard.allow_posts !== undefined) setBoardAllowPosts(updatedBoard.allow_posts === 1 || updatedBoard.allow_posts === true);
      if (updatedBoard.bg_image) setBoardBgImage(updatedBoard.bg_image);
    });

    return () => {
      leaveBoardRoom(boardId);
      socket.off('active-users-updated');
      socket.off('post-added');
      socket.off('post-like-updated');
      socket.off('post-removed');
      socket.off('post-updated');
      socket.off('board-updated');
    };
  }, [boardId]);

  // Arka planı tüm body'ye uygula
  useEffect(() => {
    const currentBg = BG_OPTIONS.find(bg => bg.id === (board?.bg_image || 'default')) || BG_OPTIONS[0];

    // Temizle
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundAttachment = '';

    // Yeni rengi uygula
    document.body.style.backgroundColor = currentBg.color;

    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [board?.bg_image]);

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setPosting(true);
    setUploading(true);

    try {
      let cover_image_url = editingPost ? editingPost.cover_image_url : null;

      if (removeCoverImage) {
        cover_image_url = null;
      }

      const uploadFileFn = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = sessionStorage.getItem('token');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (!uploadRes.ok) throw new Error('Dosya yukleme basarisiz.');
        const data = await uploadRes.json();
        return data.fileUrl;
      };

      if (selectedCoverImage) {
        cover_image_url = await uploadFileFn(selectedCoverImage);
      }

      const newAttachments = await Promise.all(selectedFiles.map(async (file) => {
        const url = await uploadFileFn(file);
        return { url, name: file.name, type: file.type.startsWith('image/') ? 'image' : 'document' };
      }));

      const finalAttachments = [...existingAttachments, ...newAttachments];

      const isGuest = !sessionStorage.getItem('token');
      const guest_nickname = sessionStorage.getItem('board_nickname');

      if (editingPost) {
        const endpoint = isGuest ? `/board/public/posts/${editingPost.id}` : `/board/posts/${editingPost.id}`;
        const data = await apiPut(endpoint, {
          content: newPostContent,
          file_url: null,
          file_type: 'none',
          cover_image_url,
          attachments: finalAttachments,
          ...(isGuest && { nickname: guest_nickname })
        });
        if (data.success) {
          setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...data.post, is_liked: p.is_liked } : p));
          emitBoardEvent('board-post-updated', { boardId, post: data.post });
        }
      } else {
        const endpoint = isGuest ? `/board/public/${boardId}/posts` : `/board/${boardId}/posts`;
        const data = await apiPost(endpoint, {
          content: newPostContent,
          file_url: null,
          file_type: 'none',
          cover_image_url,
          attachments: finalAttachments,
          ...(isGuest && { nickname: guest_nickname })
        });
        if (data.success) {
          setPosts(prev => {
            if (!prev.find(p => p.id === data.post.id)) {
              return [data.post, ...prev];
            }
            return prev;
          });
          emitBoardEvent('new-board-post', { boardId, post: data.post });
        }
      }

      closePostModal();
    } catch (err) {
      setError(err.message || 'Post isleminde hata olustu.');
    } finally {
      setPosting(false);
      setUploading(false);
    }
  };

  const handleUpdateBoard = async (e) => {
    e.preventDefault();
    if (!boardTitle.trim()) return;

    try {
      const data = await apiPut(`/board/${boardId}`, {
        title: boardTitle,
        description: boardDesc,
        bg_image: boardBgImage
      });
      if (data.success) {
        setBoard(prev => ({
          ...prev,
          title: boardTitle,
          description: boardDesc,
          bg_image: boardBgImage
        }));
        setIsEditBoardOpen(false);
      }
    } catch (err) {
      console.error(err);
      setError('Pano guncellenirken hata olustu.');
    }
  };

  const handleToggleAllowPosts = async () => {
    try {
      const newValue = !boardAllowPosts;
      const data = await apiPut(`/board/${boardId}`, { allow_posts: newValue ? 1 : 0 });
      if (data.success) {
        setBoardAllowPosts(newValue);
        setBoard(prev => ({ ...prev, allow_posts: newValue ? 1 : 0 }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (postId) => {
    try {
      const isGuest = !sessionStorage.getItem('token');
      const guest_nickname = sessionStorage.getItem('board_nickname');

      const endpoint = isGuest ? `/board/public/posts/${postId}/like` : `/board/posts/${postId}/like`;
      const data = await apiPost(endpoint, isGuest ? { nickname: guest_nickname } : {});
      if (data.success) {
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, likes: data.likes, is_liked: data.liked }
            : p
        ));

        emitBoardEvent('board-post-liked', {
          boardId,
          postId,
          likes: data.likes
        });
      }
    } catch (err) {
      console.error('Begeni hatasi:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Bu postu silmek istediginize emin misiniz?')) return;

    try {
      const isGuest = !sessionStorage.getItem('token');
      const guest_nickname = sessionStorage.getItem('board_nickname');

      if (isGuest) {
        const token = sessionStorage.getItem('token');
        const uploadRes = await fetch(`/api/board/public/posts/${postId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname: guest_nickname })
        });
        const data = await uploadRes.json();
        if (!data.success) throw new Error(data.message);
      } else {
        await apiDelete(`/board/posts/${postId}`);
      }

      setPosts(prev => prev.filter(p => p.id !== postId));

      emitBoardEvent('board-post-deleted', { boardId, postId });
    } catch (err) {
      setError(err.message || 'Post silinirken hata olustu.');
    }
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setNewPostContent(post.content);
    setSelectedFiles([]);

    let atts = [];
    if (post.file_url) atts.push({ url: post.file_url, name: post.file_url.split('/').pop(), type: post.file_type });
    if (post.attachments) {
      const parsed = typeof post.attachments === 'string' ? JSON.parse(post.attachments) : post.attachments;
      atts = [...atts, ...parsed];
    }
    // ensure unique
    atts = atts.filter((v, i, a) => a.findIndex(t => (t.url === v.url)) === i);
    setExistingAttachments(atts);

    setSelectedCoverImage(null);
    setRemoveCoverImage(false);
    setIsAddModalOpen(true);
  };

  const closePostModal = () => {
    setIsAddModalOpen(false);
    setEditingPost(null);
    setNewPostContent('');
    setSelectedFiles([]);
    setExistingAttachments([]);
    setSelectedCoverImage(null);
    setRemoveCoverImage(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error && !board) {
    return (
      <div className="max-w-2xl mx-auto card text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/" className="btn-primary">Anasayfaya Don</Link>
      </div>
    );
  }

  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const currentBg = BG_OPTIONS.find(bg => bg.id === (board?.bg_image || 'default')) || BG_OPTIONS[0];

  return (
    <div className={`min-h-screen flex-grow w-full flex flex-col overflow-x-hidden`}>
      <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 flex-grow transition-all duration-500`}>
        {/* Board Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-16 border-b ${currentBg.isLight ? 'border-gray-200' : 'border-white/20'} pb-8`}>
          <div className="mb-6 sm:mb-0">
            <div className="flex items-center gap-4 mb-2">
              <h1 className={`text-4xl font-extrabold tracking-tight ${currentBg.isLight ? 'text-emerald-950' : 'text-white'}`}>{board?.title}</h1>
              {myRole === 'owner' && (
                <button onClick={() => setIsEditBoardOpen(true)} className={`transition-colors ${currentBg.isLight ? 'text-gray-400 hover:text-black' : 'text-white/50 hover:text-white'}`} title="Panoyu Düzenle">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
              )}
            </div>
            <p className={`text-sm max-w-2xl ${currentBg.isLight ? 'text-gray-500' : 'text-white/80'}`}>{board?.description}</p>
            {(!board?.is_active || board?.is_active === 0) && (
              <span className="inline-block mt-4 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md uppercase tracking-wider">
                Bu Pano Öğrenci Girişine Kapatılmıştır
              </span>
            )}
            {(!board?.allow_posts || board?.allow_posts === 0) && myRole !== 'owner' && (
              <span className="inline-block mt-4 ml-2 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md uppercase tracking-wider">
                Paylaşım Kapalı
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-6 items-center">
            {myRole === 'owner' && (
              <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-colors shadow-sm ${currentBg.isLight ? 'bg-white/70 hover:bg-white border-emerald-100' : 'bg-white/10 hover:bg-white/20 border-white/20 backdrop-blur-md'}`}>
                <span className={`text-xs font-extrabold tracking-wide select-none ${currentBg.isLight ? 'text-emerald-900' : 'text-white'}`}>Paylaşım İzni:</span>
                <button
                  type="button"
                  onClick={handleToggleAllowPosts}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shadow-inner ${boardAllowPosts ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  title={boardAllowPosts ? "Paylaşımı Kapat" : "Paylaşımı Aç"}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform border border-gray-300 shadow-sm ${boardAllowPosts ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
                  />
                </button>
              </div>
            )}
            <span className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold border rounded-lg ${currentBg.isLight ? (myRole === 'owner' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-emerald-100 text-emerald-600') : (myRole === 'owner' ? 'border-white/50 bg-white/20 text-white' : 'border-white/30 text-white/80')}`}>
              {myRole === 'owner' ? 'Kurucu' : 'Üye'}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 2xl:gap-12 items-start w-full">
          {/* Left Side: Posts Feed - Masonry Layout */}
          <div className="flex-1 w-full min-w-0">
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 2xl:columns-5 3xl:columns-6 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, post.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, post.id)}
                  className={`break-inside-avoid mb-6 rounded-xl shadow-md border transition-all duration-300 relative cursor-move overflow-hidden ${currentBg.isLight ? 'bg-white border-emerald-100' : 'bg-white/10 backdrop-blur-md border-white/20'} ${draggedPostId === post.id ? 'opacity-50 scale-95' : 'opacity-100 hover:shadow-xl hover:-translate-y-1'}`}
                >
                  {post.cover_image_url && (
                    <div className={`w-full h-48 sm:h-56 border-b flex items-center justify-center overflow-hidden ${currentBg.isLight ? 'border-emerald-50 bg-[#f9f9f9]' : 'border-white/10 bg-black/20'}`}>
                      <img src={post.cover_image_url} alt="Kapak" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                    </div>
                  )}
                  {/* Header of the post */}
                  <div className={`px-6 py-4 border-b flex justify-between items-center ${currentBg.isLight ? 'border-emerald-50 bg-emerald-50/30' : 'border-white/10 bg-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm uppercase tracking-wider shadow-inner ${currentBg.isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-white/20 text-white'}`}>
                        {post.author_name?.substring(0, 2) || '?'}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${currentBg.isLight ? 'text-emerald-950' : 'text-white'}`}>{post.author_name}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${currentBg.isLight ? 'text-emerald-600/70' : 'text-white/60'}`}>{new Date(post.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {(myRole === 'owner' || ((post.user_id === currentUser?.id || (!post.user_id && post.author_name === sessionStorage.getItem('board_nickname'))) && (board?.allow_posts === 1 || board?.allow_posts === true))) && (
                        <>
                          <button
                            onClick={() => openEditModal(post)}
                            className={`transition-colors p-1 ${currentBg.isLight ? 'text-gray-400 hover:text-blue-500' : 'text-white/40 hover:text-white'}`}
                            title="Duzenle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className={`transition-colors p-1 ${currentBg.isLight ? 'text-gray-400 hover:text-red-500' : 'text-white/40 hover:text-red-400'}`}
                            title="Sil"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content of the post */}
                  <div className="p-6">
                    <p className={`whitespace-pre-wrap text-sm leading-relaxed ${currentBg.isLight ? 'text-gray-700' : 'text-white/90'}`}>{post.content}</p>

                    {/* Attachments rendering */}
                    {(() => {
                      let atts = [];
                      if (post.file_url) atts.push({ url: post.file_url, name: post.file_url.split('/').pop(), type: post.file_type });
                      if (post.attachments) {
                        const parsed = typeof post.attachments === 'string' ? JSON.parse(post.attachments) : post.attachments;
                        atts = [...atts, ...parsed];
                      }
                      atts = atts.filter((v, i, a) => a.findIndex(t => (t.url === v.url)) === i);

                      if (atts.length > 0) {
                        return (
                          <div className={`mt-6 pt-4 border-t flex flex-col gap-2 ${currentBg.isLight ? 'border-gray-50' : 'border-white/10'}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${currentBg.isLight ? 'text-gray-400' : 'text-white/50'}`}>Attachments ({atts.length})</p>
                            {atts.map((att, i) => (
                              <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className={`font-medium text-xs flex items-center gap-2 p-3 transition-colors ${currentBg.isLight ? 'text-black bg-[#f9f9f9] border border-gray-200 hover:bg-gray-100' : 'text-white/90 bg-white/10 border border-white/20 hover:bg-white/20'}`}>
                                <svg className={`w-4 h-4 flex-shrink-0 ${currentBg.isLight ? 'text-gray-500' : 'text-white/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                <span className="truncate">{att.name || 'View File'}</span>
                              </a>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Footer / Likes */}
                  <div className={`px-6 py-4 border-t flex items-center ${currentBg.isLight ? 'border-gray-50 bg-[#fafafa]' : 'border-white/10 bg-white/5'}`}>
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${post.is_liked
                        ? (currentBg.isLight ? 'bg-pink-100 text-pink-600 shadow-sm' : 'bg-pink-500/30 text-pink-200 shadow-sm')
                        : (currentBg.isLight ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-white/10 text-white/60 hover:bg-white/20')
                        }`}
                    >
                      {post.is_liked ? '❤️' : '🤍'} {post.likes || 0}
                    </button>
                  </div>
                </div>
              ))}

              {posts.length === 0 && (
                <div className="col-span-full flex justify-center py-20 break-inside-avoid">
                  <div className={`${currentBg.isLight ? 'bg-white/80 border-emerald-100 text-emerald-950' : 'bg-white/10 border-white/20 text-white'} backdrop-blur-md rounded-2xl p-8 border text-center max-w-md shadow-2xl`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl ${currentBg.isLight ? 'bg-emerald-100' : 'bg-white/20'}`}>✨</div>
                    <h3 className="text-2xl font-bold mb-2">Pano bombos!</h3>
                    <p className={currentBg.isLight ? 'text-emerald-700' : 'text-white/80'}>Sag alt kosedeki arti butonuna tiklayarak ilk iceriginizi paylasin ve panoyu canlandirin.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: QR Code and Participants */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6 sticky top-28">
            {/* QR Code Card */}
            <div className={`p-8 rounded-2xl border shadow-xl flex flex-col items-center text-center transition-colors ${currentBg.isLight ? 'bg-white border-emerald-100' : 'bg-white/10 border-white/20 backdrop-blur-md'}`}>
              <h3 className={`text-lg font-bold mb-6 ${currentBg.isLight ? 'text-emerald-950' : 'text-white'}`}>Panoya Katıl</h3>
              <div className="bg-white p-4 rounded-xl shadow-inner mb-6">
                <QRCodeSVG value={`${baseUrl}/join-board?code=${board?.code}`} size={180} level={"H"} />
              </div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${currentBg.isLight ? 'text-emerald-600/70' : 'text-white/60'}`}>Veya Kod İle Katıl</p>
              <div className={`font-mono font-bold text-3xl tracking-[0.2em] px-6 py-3 rounded-xl border ${currentBg.isLight ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-black/30 text-white border-white/20'}`}>
                {board?.code}
              </div>
            </div>

            {/* Active Participants Card */}
            <div className={`p-6 rounded-2xl border shadow-lg transition-colors flex flex-col max-h-[500px] ${currentBg.isLight ? 'bg-white border-emerald-100' : 'bg-white/10 border-white/20 backdrop-blur-md'}`}>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${currentBg.isLight ? 'text-emerald-900' : 'text-white'}`}>
                  Katılımcılar ({activeUsers.length})
                </h3>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {activeUsers.map((user, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentBg.isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900' : 'bg-white/5 hover:bg-white/10 text-white'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${currentBg.isLight ? 'bg-emerald-200 text-emerald-800' : 'bg-white/20 text-white'}`}>
                      {user.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm truncate">
                      {user} {user === board?.teacher_name && <span className="text-[10px] opacity-60 ml-1">(Kurucu)</span>}
                    </span>
                  </div>
                ))}
                {activeUsers.length === 0 && (
                  <p className={`text-xs text-center py-4 ${currentBg.isLight ? 'text-gray-400' : 'text-white/50'}`}>Şu an kimse yok.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Button for Adding Post */}
        {(board?.allow_posts === 1 || board?.allow_posts === true || myRole === 'owner') && (
          <button
            onClick={() => {
              setEditingPost(null);
              setNewPostContent('');
              setSelectedFiles([]);
              setExistingAttachments([]);
              setSelectedCoverImage(null);
              setRemoveCoverImage(false);
              setIsAddModalOpen(true);
            }}
            className="fixed bottom-8 right-8 w-16 h-16 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all z-40 text-4xl font-light border-4 border-white/20"
            title="Yeni Post Ekle"
          >
            +
          </button>
        )}

        {/* Add/Edit Post Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closePostModal}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">{editingPost ? 'Gonderiyi Duzenle' : 'Yeni Gonderi'}</h3>
                <button onClick={closePostModal} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSavePost} className="p-6">
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none mb-4"
                  rows={4}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Panoda ne paylasmak istersiniz? Fikirlerinizi, notlarinizi yazin..."
                  autoFocus
                  required
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kapak Resmi (Istege Bagli)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedCoverImage(e.target.files[0])}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 transition-colors"
                  />
                  {editingPost?.cover_image_url && !selectedCoverImage && !removeCoverImage && (
                    <div className="flex items-center gap-3 mt-2">
                      <img src={editingPost.cover_image_url} alt="Kapak" className="h-10 w-10 object-cover rounded shadow-sm" />
                      <button type="button" onClick={() => setRemoveCoverImage(true)} className="text-xs font-bold text-red-500 hover:text-red-700">
                        Kapak Resmini Kaldir
                      </button>
                    </div>
                  )}
                  {removeCoverImage && !selectedCoverImage && (
                    <p className="text-xs text-red-500 mt-2 font-medium">Kapak resmi silinecek.</p>
                  )}
                </div>

                <div className="mb-6 border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ek Dosyalar (Birden fazla secebilirsiniz)</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
                  />

                  {/* Existing Attachments */}
                  {existingAttachments.length > 0 && (
                    <div className="mt-3 flex flex-col gap-1">
                      <p className="text-xs font-semibold text-gray-500">Mevcut Dosyalar:</p>
                      {existingAttachments.map((att, i) => (
                        <div key={i} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded border border-gray-100">
                          <span className="truncate max-w-[200px] text-gray-600">{att.name || att.url.split('/').pop()}</span>
                          <button type="button" onClick={() => setExistingAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50">Sil</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 flex flex-col gap-1">
                      <p className="text-xs font-semibold text-emerald-600">Yeni Secilen Dosyalar:</p>
                      {selectedFiles.map((file, i) => (
                        <div key={i} className="flex justify-between items-center text-xs bg-emerald-50 p-2 rounded border border-emerald-100">
                          <span className="truncate max-w-[200px] text-emerald-800">{file.name}</span>
                          <button type="button" onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50">Iptal</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closePostModal} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
                    Iptal
                  </button>
                  <button type="submit" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition-all flex items-center gap-2" disabled={posting || uploading}>
                    {(posting || uploading) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        {editingPost ? 'Guncelle' : 'Paylas'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Board Modal */}
        {isEditBoardOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsEditBoardOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Pano Ayarlari</h3>
                <button onClick={() => setIsEditBoardOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleUpdateBoard} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Pano Basligi</label>
                  <input
                    type="text"
                    value={boardTitle}
                    onChange={(e) => setBoardTitle(e.target.value)}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Aciklama</label>
                  <textarea
                    value={boardDesc}
                    onChange={(e) => setBoardDesc(e.target.value)}
                    className="input-field w-full"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Arka Plan Rengi</label>
                  <div className="flex flex-wrap gap-3">
                    {BG_OPTIONS.map(bg => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setBoardBgImage(bg.id)}
                        className={`relative w-12 h-12 rounded-full overflow-hidden transition-all duration-300 ${boardBgImage === bg.id ? 'ring-4 ring-emerald-500 ring-offset-2 scale-110 shadow-lg' : 'ring-1 ring-gray-200 hover:scale-105 hover:shadow-md'
                          }`}
                        title={bg.name}
                        style={{ backgroundColor: bg.color }}
                      >
                        {boardBgImage === bg.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className={`w-6 h-6 ${bg.isLight ? 'text-emerald-900' : 'text-white'} drop-shadow`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsEditBoardOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">
                    Iptal
                  </button>
                  <button type="submit" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold">
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
