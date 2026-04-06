/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const SearchContext = createContext();

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
}

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [searchMode, setSearchMode]       = useState('products');
  const [searchHandler, setSearchHandler] = useState(null);
  const [placeholder, setPlaceholder]     = useState('Search...');
  const [resultRenderer, setResultRenderer] = useState(null);

  // Debounce ref — cancel previous in-flight search on rapid typing
  const debounceRef = useRef(null);
  // Register a search handler for the current page
  const registerSearchHandler = useCallback((mode, handler, customPlaceholder, renderer) => {
    setSearchMode(mode);
    setSearchHandler(() => handler);
    setPlaceholder(customPlaceholder || `Search ${mode}...`);
    setResultRenderer(() => renderer);
    // Clear stale results from previous page
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  // Unregister when component unmounts — fully clear everything
  const unregisterSearchHandler = useCallback(() => {
    setSearchHandler(null);
    setResultRenderer(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // Perform search — debounced, always hits the handler fresh (no local result cache)
  const performSearch = useCallback(async (query) => {
    setSearchQuery(query);

    // Clear results immediately on empty query
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (!searchHandler) return;

    // Debounce — wait 280ms after last keystroke before firing
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Each search call gets the very latest query
        const results = await searchHandler(query);
        setSearchResults(results || []);
      } catch (error) {
        // Don't surface search errors — just clear results
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);
  }, [searchHandler]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        searchResults,
        isSearching,
        searchMode,
        placeholder,
        resultRenderer,
        performSearch,
        clearSearch,
        registerSearchHandler,
        unregisterSearchHandler
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}
