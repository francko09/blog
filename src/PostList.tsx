import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

type Post = {
  id: number;
  title: string;
  content: string;
  image_url: string;
  created_at: string;
  profiles: { username: string };
};

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error);
      } else {
        setPosts(data as Post[]);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-white shadow-md rounded p-4 mb-4">
          <h2 className="text-xl font-bold">{post.title}</h2>
          <p className="text-gray-600">by {post.profiles.username} on {new Date(post.created_at).toLocaleDateString()}</p>
          {post.image_url && <img src={post.image_url} alt={post.title} className="my-4" />}
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
}
