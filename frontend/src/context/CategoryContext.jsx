/* eslint-disable react-refresh/only-export-components */
/**
 * CategoryContext — §2.4
 * Shared state between CustomerSidebar / Sidebar and Shop / AdminShopping.
 * The sidebar drives the category view; the page reacts to it.
 *
 * sidebarView: 'main' | 'categories' | 'subcategories'
 * selectedCategory: null | 'STATIONERY' | 'BOOKS' | 'TOYS'
 * selectedSubCategory: null | string
 */
import { createContext, useContext, useState, useCallback } from 'react';

const CategoryContext = createContext();

export const useCategory = () => useContext(CategoryContext);

export const CategoryProvider = ({ children }) => {
  const [sidebarView, setSidebarView]             = useState('main');          // which panel the sidebar shows
  const [selectedCategory, setSelectedCategory]   = useState(null);           // STATIONERY | BOOKS | TOYS
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);       // free-text subCategory string

  // Called when user clicks "Shop By Category" in main sidebar view
  const openCategories = useCallback(() => {
    setSidebarView('categories');
    setSelectedCategory(null);
    setSelectedSubCategory(null);
  }, []);

  // Called when user clicks one of the 3 main categories
  const openSubCategories = useCallback((category) => {
    setSelectedCategory(category);
    setSelectedSubCategory(null);
    setSidebarView('subcategories');
  }, []);

  // Called when user clicks a subCategory chip
  const selectSubCategory = useCallback((subCat) => {
    setSelectedSubCategory(subCat);
  }, []);

  // Back from subcategories → categories panel
  const backToCategories = useCallback(() => {
    setSidebarView('categories');
    setSelectedCategory(null);
    setSelectedSubCategory(null);
  }, []);

  // Back from categories → main nav
  const backToMain = useCallback(() => {
    setSidebarView('main');
    setSelectedCategory(null);
    setSelectedSubCategory(null);
  }, []);

  // Full reset — also called when navigating away
  const resetCategory = useCallback(() => {
    setSidebarView('main');
    setSelectedCategory(null);
    setSelectedSubCategory(null);
  }, []);

  return (
    <CategoryContext.Provider value={{
      sidebarView,
      selectedCategory,
      selectedSubCategory,
      openCategories,
      openSubCategories,
      selectSubCategory,
      backToCategories,
      backToMain,
      resetCategory,
    }}>
      {children}
    </CategoryContext.Provider>
  );
};
