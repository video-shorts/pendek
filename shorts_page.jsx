import React, { useState, useRef, useEffect } from 'react';

export default function ShortsPage() {
  const [videos, setVideos] = useState(() => JSON.parse(localStorage.getItem('videos')) || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(null);
  const [user, setUser] = useState(localStorage.getItem('currentUser') || '');
  const [commentText, setCommentText] = useState('');
  const videoRefs = useRef([]);

  const videosPerPage = 6;

  useEffect(() => {
    localStorage.setItem('videos', JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVideos(JSON.parse(localStorage.getItem('videos')) || []);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    const name = prompt('Masukkan nama pengguna:');
    if (name) {
      setUser(name);
      localStorage.setItem('currentUser', name);
    }
  };

  const handleVideoEnd = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  const handleLike = (index) => {
    if (!user) return alert('Harus login dulu!');
    const updated = [...videos];
    if (!(updated[index].likers || []).includes(user)) {
      updated[index].likes = (updated[index].likes || 0) + 1;
      updated[index].likers = [...(updated[index].likers || []), user];
    }
    setVideos(updated);
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newVideo = { url, title: file.name, description: '', likes: 0, comments: [], rating: 0, ratingCount: 0, views: 0, date: Date.now(), category: '', likers: [] };
      setVideos([newVideo, ...videos]);
    }
  };

  const handleDelete = (index) => {
    const updated = videos.filter((_, i) => i !== index);
    setVideos(updated);
  };

  const handleEdit = (index, field, value) => {
    const updated = [...videos];
    updated[index][field] = value;
    setVideos(updated);
  };

  const handleComment = (index) => {
    if (!user) return alert('Harus login dulu!');
    if (!commentText.trim()) return;
    const updated = [...videos];
    updated[index].comments.push({ user, text: commentText });
    setVideos(updated);
    setCommentText('');
  };

  const handleRating = (index, value) => {
    if (!user) return alert('Harus login dulu!');
    const updated = [...videos];
    const totalScore = (updated[index].rating || 0) * (updated[index].ratingCount || 0) + value;
    updated[index].ratingCount = (updated[index].ratingCount || 0) + 1;
    updated[index].rating = totalScore / updated[index].ratingCount;
    setVideos(updated);
  };

  const handleView = (index) => {
    const updated = [...videos];
    updated[index].views = (updated[index].views || 0) + 1;
    setVideos(updated);
  };

  const filtered = videos
    .filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(v => !selectedCategory || v.category === selectedCategory);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'likes') return b.likes - a.likes;
    if (sortBy === 'views') return b.views - a.views;
    if (sortBy === 'newest') return b.date - a.date;
    if (sortBy === 'oldest') return a.date - b.date;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / videosPerPage);
  const paginated = sorted.slice((currentPage - 1) * videosPerPage, currentPage * videosPerPage);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <button onClick={() => setShowGrid(!showGrid)} className="px-4 py-2 bg-blue-500 text-white rounded">{showGrid ? 'Show Shorts' : 'Show Grid'}</button>
          <input type="file" accept="video/*" onChange={handleUpload} />
        </div>
        <div>
          {user ? <span className="mr-2">👤 {user}</span> : <button onClick={handleLogin} className="px-4 py-2 bg-green-500 text-white rounded">Login</button>}
        </div>
      </div>

      {showGrid ? (
        <div>
          <div className="flex gap-2 mb-4">
            <input placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border p-2" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border p-2">
              <option value="">Sort</option>
              <option value="rating">Rating Tertinggi</option>
              <option value="likes">Like Terbanyak</option>
              <option value="views">View Terbanyak</option>
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border p-2">
              <option value="">Semua Kategori</option>
              {[...new Set(videos.map(v => v.category).filter(Boolean))].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {paginated.map((v, i) => (
              <div key={i} className="border p-2">
                <video src={v.url} className="w-full h-40 object-cover" onClick={() => {setShowModal(i); handleView(i);}} />
                <input value={v.title} onChange={e => handleEdit(i, 'title', e.target.value)} className="border w-full" />
                <textarea value={v.description} onChange={e => handleEdit(i, 'description', e.target.value)} className="border w-full" />
                <input placeholder="Kategori" value={v.category} onChange={e => handleEdit(i, 'category', e.target.value)} className="border w-full" />
                <p>{v.likes || 0} Likes | {v.views || 0} Views | ⭐ {v.rating?.toFixed(1) || 0}</p>
                {v.likers?.length>0 && <p className="text-xs text-gray-600">Liked by: {v.likers.join(', ')}</p>}
                <button onClick={() => handleLike(i)} className="text-blue-500">Like</button>
                <button onClick={() => handleDelete(i)} className="text-red-500 ml-2">Delete</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 border ${currentPage===i+1?'bg-blue-500 text-white':''}`}>{i+1}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {videos.length>0 && (
            <video
              ref={el => videoRefs.current[currentIndex] = el}
              src={videos[currentIndex].url}
              className="w-full max-w-md h-96 object-cover"
              autoPlay
              controls
              onEnded={handleVideoEnd}
              onPlay={() => handleView(currentIndex)}
            />
          )}
          <div className="mt-2">
            <button onClick={() => handleLike(currentIndex)} className="px-4 py-2 bg-pink-500 text-white rounded">Like</button>
          </div>
        </div>
      )}

      {showModal !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded max-w-md w-full">
            <video src={videos[showModal].url} className="w-full h-64 object-cover" controls onPlay={() => handleView(showModal)} />
            <h2 className="text-lg font-bold mt-2">{videos[showModal].title}</h2>
            <p>{videos[showModal].description}</p>
            <p>{videos[showModal].likes || 0} Likes | {videos[showModal].views || 0} Views | ⭐ {videos[showModal].rating?.toFixed(1) || 0}</p>
            {videos[showModal].likers?.length>0 && <p className="text-xs text-gray-600">Liked by: {videos[showModal].likers.join(', ')}</p>}

            <div className="mt-2">
              <h3 className="font-bold">Beri Rating</h3>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(star=>(
                  <span key={star} onClick={()=>handleRating(showModal, star)} className="cursor-pointer text-yellow-500 text-xl">★</span>
                ))}
              </div>
            </div>

            <div className="mt-2">
              <h3 className="font-bold">Komentar</h3>
              <div className="max-h-32 overflow-y-auto border p-2 mb-2">
                {videos[showModal].comments?.map((c, idx) => (
                  <p key={idx} className="text-sm"><span className="font-bold">{c.user}:</span> {c.text}</p>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Tulis komentar" className="border p-1 flex-1" />
                <button onClick={()=>handleComment(showModal)} className="px-2 bg-blue-500 text-white rounded">Kirim</button>
              </div>
            </div>

            <button onClick={() => setShowModal(null)} className="mt-2 px-4 py-2 bg-red-500 text-white rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
