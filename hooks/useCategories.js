import { useState, useEffect } from 'react';
import api from '@/services/axiosConfig';

let cachedCategories = null;
let fetchPromise = null;

export const useCategories = () => {
  const [categories, setCategories] = useState(cachedCategories || []);
  const [loading, setLoading] = useState(!cachedCategories);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedCategories) return;

    const fetchCategories = async () => {
      try {
        if (!fetchPromise) {
          fetchPromise = api.get('/categories/tree');
        }
        const response = await fetchPromise;
        const data = response.data;

        if (Array.isArray(data)) {
          cachedCategories = data;
        } else if (data && Array.isArray(data.content)) {
          cachedCategories = data.content;
        } else if (data && Array.isArray(data.data)) {
          cachedCategories = data.data;
        } else {
          console.error('🚨 API returned invalid data:', data);
          cachedCategories = [];
        }

        setCategories(cachedCategories);
      } catch (err) {
        fetchPromise = null;
        cachedCategories = null;
        console.error('Failed to fetch categories', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};