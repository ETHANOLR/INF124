import React from 'react';
import './PostCard.css';
import { Button } from '../buttons/buttons';

function PostCard({ title, thumbnail, detail, username, onLike, onComment, onShare, avatar }) {
    //The PostCard Component, will generate a PostCard with the titile, thumbnail, detail, username, onLike, onComment, onShare, avatar
    //title(String): the title of the postcard
    //thumbnail(image src, optional): The thumbnail of the post card
    //detail(String, optional): the detail of the post card
    //username(string, optional): the username
    //onLike(function, optional): generate the like button with calling the input function when button pressed
    //onComment(function, optional); same as the onLike, for comment
    //onShare(function, optional): same as the onLike, for share
    //avatar(image src, optional): the avatar of the user(头像)
  return (
    <div className="post-card">
      <div className="post-thumbnail">
        {thumbnail ? (
          <img src={thumbnail} alt="Post Thumbnail" className="thumbnail-img" />
        ) : (
          <div className="default-thumbnail" />
        )}
      </div>

      <div className="post-info">
        <h3 className="post-title">{title}</h3>
        {detail && <p className="post-detail">{detail}</p>}

        {username && (
          <div className="post-user">
            <div className="avatar">{avatar || <div className="default-avatar" />}</div>
            <span className="username">{username}</span>
          </div>
        )}

        {(onLike || onComment || onShare) && (
          <div className="post-actions">
            {onLike && <Button text="Like" onClick={onLike} type = "secondary" />}
            {onComment && <Button text="Comment" onClick={onComment} type = "secondary"/>}
            {onShare && <Button text="Share" onClick={onShare} type = "secondary"/>}
          </div>
        )}
      </div>
    </div>
  );
}

export default PostCard;
