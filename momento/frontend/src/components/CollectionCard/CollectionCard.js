import React from "react";
import "./CollectionCard.css";

export default function CollectionCard({ title, posts }) {
  return (
    <div className="collection-card">
      <div className="card-cover" />
      <div className="card-content">
        <h3 className="collection-title">{title}</h3>
        <p className="collection-subtitle">{posts} posts</p>
      </div>
    </div>
  );
}