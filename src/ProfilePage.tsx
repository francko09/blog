import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { PostgrestError } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

type Post = {
  id: number;
  title: string;
  content: string;
  image_url: string;
  created_at: string;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (user) {
      const fetchPosts = async () => {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          setError(error);
        } else {
          setPosts(data as Post[]);
        }
        setLoading(false);
      };

      fetchPosts();
    }
  }, [user]);

  const handleDelete = async (postId: number) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      console.error('Error deleting post:', error);
    } else {
      setPosts(posts.filter((post) => post.id !== postId));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Posts</h1>
      <p className="mb-4">Email: {user?.email}</p>
      <Link to="/create-post" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 inline-block">
        Create New Post
      </Link>
      <div>
        {posts.map((post) => (
          <div key={post.id} className="bg-white shadow-md rounded p-4 mb-4">
            <h2 className="text-xl font-bold">{post.title}</h2>
            <p className="text-gray-600">on {new Date(post.created_at).toLocaleDateString()}</p>
            {post.image_url && <img src={post.image_url} alt={post.title} className="my-4" />}
            <p>{post.content}</p>
            <div className="mt-4">
              <Link to={`/edit-post/${post.id}`} className="text-blue-500 mr-4">
                Edit
              </Link>
              <button onClick={() => handleDelete(post.id)} className="text-red-500">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
