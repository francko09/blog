import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

export default function PostForm() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching post:', error);
        } else {
          setTitle(data.title);
          setContent(data.content);
        }
      };
      fetchPost();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to create a post.');
      return;
    }

    setLoading(true);
    let imageUrl = '';

    if (imageFile) {
      const { data, error } = await supabase.storage
        .from('post_images')
        .upload(`${user.id}/${Date.now()}`, imageFile);

      if (error) {
        console.error('Error uploading image:', error);
      } else {
        const { data: { publicUrl } } = supabase.storage.from('post_images').getPublicUrl(data.path);
        imageUrl = publicUrl;
      }
    }

    const post = {
      user_id: user.id,
      title,
      content,
      image_url: imageUrl,
    };

    if (id) {
      const { error } = await supabase.from('posts').update(post).eq('id', id);
      if (error) {
        console.error('Error updating post:', error);
      }
    } else {
      const { error } = await supabase.from('posts').insert(post);
      if (error) {
        console.error('Error creating post:', error);
      }
    }

    setLoading(false);
    navigate('/');
  };

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 font-bold mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="content" className="block text-gray-700 font-bold mb-2">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="image" className="block text-gray-700 font-bold mb-2">
            Image
          </label>
          <input
            type="file"
            id="image"
            onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
