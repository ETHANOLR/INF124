import React from "react";
import "./CollectionCard.css";

/**
 * CollectionCard Component
 * 
 * Displays collection information with consistent styling matching post cards
 * Supports visual distinction for private collections
 */
export default function CollectionCard({ title, posts, isPrivate = false }) {
  return (
    <div className={`collection-card ${isPrivate ? 'private' : ''}`}>
      <div className="card-cover" />
      <div className="card-content">
        <h3 className="collection-title">
          {title}
          {isPrivate && <span style={{ marginLeft: '8px', fontSize: '12px' }}>🔒</span>}
        </h3>
        <p className="collection-subtitle">{posts} posts</p>
      </div>
    </div>
  );
}