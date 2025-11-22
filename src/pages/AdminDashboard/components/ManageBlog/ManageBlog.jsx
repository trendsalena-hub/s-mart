import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../../firebase/config.js";
import "./ManageBlog.scss";

const ManageBlog = ({ posts, loading, onRefresh, onSuccess, onError }) => {
  const [editingPost, setEditingPost] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    author: "Admin",
    featureImage: "",
    excerpt: "",
    content: "",
    status: "draft",
    category: "general",
    tags: "", // string in form, array in Firestore
    readTime: "",
    metaTitle: "",
    metaDescription: "",
  });

  const [contentImages, setContentImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // -------------------------------------------------------------------
  // Populate form when editing a post
  // -------------------------------------------------------------------
  useEffect(() => {
    if (editingPost) {
      setForm({
        title: editingPost.title || "",
        slug: editingPost.slug || "",
        author: editingPost.author || "Admin",
        featureImage: editingPost.featureImage || "",
        excerpt: editingPost.excerpt || "",
        content: editingPost.content || "",
        status: editingPost.status || "draft",
        category: editingPost.category || "general",
        tags: Array.isArray(editingPost.tags)
          ? editingPost.tags.join(", ")
          : editingPost.tags || "",
        readTime: editingPost.readTime || "",
        metaTitle: editingPost.metaTitle || "",
        metaDescription: editingPost.metaDescription || "",
      });
      setContentImages(editingPost.contentImages || []);
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPost]);

  // -------------------------------------------------------------------
  // Input change handler
  // -------------------------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newSlug = form.slug;

    // Auto-generate slug from title if slug is empty
    if (name === "title" && !form.slug) {
      newSlug = value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-");
    }

    // Auto-calculate read time from content
    if (name === "content" && !form.readTime) {
      const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
      const readTime = Math.max(1, Math.ceil(wordCount / 200));
      setForm((prev) => ({ ...prev, readTime: readTime.toString() }));
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
      slug: name === "title" ? newSlug : prev.slug,
    }));
  };

  // -------------------------------------------------------------------
  // Slug input handler (manual)
  // -------------------------------------------------------------------
  const handleSlugChange = (e) => {
    const { value } = e.target;
    setForm((prev) => ({
      ...prev,
      slug: value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-"),
    }));
  };

  // -------------------------------------------------------------------
  // Feature image upload
  // -------------------------------------------------------------------
  const handleFeatureImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError("Image size should be less than 5MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const storageRef = ref(
        storage,
        `blog/featureImages/${Date.now()}_${file.name}`
      );

      const uploadTask = uploadBytes(storageRef, file);
      uploadTask.then(() => setUploadProgress(100));

      await uploadTask;
      const downloadURL = await getDownloadURL(storageRef);
      setForm((prev) => ({ ...prev, featureImage: downloadURL }));
      onSuccess("Feature image uploaded successfully!");
    } catch (err) {
      console.error("Feature image upload failed:", err);
      onError("Failed to upload feature image.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // -------------------------------------------------------------------
  // Content images upload
  // -------------------------------------------------------------------
  const handleContentImagesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );

    if (!validFiles.length) {
      onError("Please select valid image files (max 5MB each).");
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const storageRef = ref(
          storage,
          `blog/contentImages/${Date.now()}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return {
          id: Date.now() + Math.random(),
          url: downloadURL,
          alt: file.name.replace(/\.[^/.]+$/, ""),
          caption: "",
        };
      });

      const newImages = await Promise.all(uploadPromises);
      setContentImages((prev) => [...prev, ...newImages]);
      onSuccess(`${newImages.length} image(s) uploaded successfully!`);
    } catch (err) {
      console.error("Content images upload failed:", err);
      onError("Failed to upload some images.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeContentImage = (imageId) => {
    setContentImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const updateImageCaption = (imageId, caption) => {
    setContentImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, caption } : img))
    );
  };

  const insertImageIntoContent = (imageUrl, altText = "") => {
    const textarea = document.getElementById("content");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const imageMarkdown = `![${altText}](${imageUrl})`;

    const newContent =
      form.content.substring(0, start) +
      imageMarkdown +
      form.content.substring(end);

    setForm((prev) => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + imageMarkdown.length,
        start + imageMarkdown.length
      );
    }, 0);
  };

  const insertImageGallery = () => {
    if (!contentImages.length) {
      onError("No images available to create gallery.");
      return;
    }

    const galleryMarkdown =
      "\n\n" +
      contentImages
        .map(
          (img) => `![${img.alt || "Gallery image"}](${img.url})`
        )
        .join("\n\n") +
      "\n\n";

    setForm((prev) => ({
      ...prev,
      content: prev.content + galleryMarkdown,
    }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      slug: "",
      author: "Admin",
      featureImage: "",
      excerpt: "",
      content: "",
      status: "draft",
      category: "general",
      tags: "",
      readTime: "",
      metaTitle: "",
      metaDescription: "",
    });
    setContentImages([]);
    setEditingPost(null);
    setActiveTab("content");
  };

  // -------------------------------------------------------------------
  // SAVE BLOG + NOTIFICATION
  // -------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.slug || !form.content || !form.excerpt) {
      onError(
        "Please fill in all required fields: Title, Slug, Excerpt, and Content."
      );
      return;
    }

    if (!form.featureImage) {
      onError("Please upload a feature image.");
      return;
    }

    setIsSubmitting(true);

    try {
      const tagsArray = form.tags
        ? form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [];

      const postData = {
        ...form,
        contentImages,
        tags: tagsArray,
        updatedAt: serverTimestamp(),
      };

      // -------------------------------------------------
      // 1️⃣ EDIT EXISTING POST
      // -------------------------------------------------
      if (editingPost) {
        const postRef = doc(db, "blogPosts", editingPost.id);
        await updateDoc(postRef, postData);

        // If status is published, send a "blog updated/published" notification
        if (form.status === "published") {
          await addDoc(collection(db, "notifications"), {
            type: "blog",
            title: form.title,
            message:
              form.excerpt.length > 120
                ? form.excerpt.substring(0, 120) + "..."
                : form.excerpt,
            image: form.featureImage,
            blog: {
              title: form.title,
              excerpt: form.excerpt,
              image: form.featureImage,
            },
            slug: form.slug,
            docId: editingPost.id,
            collection: "blogPosts",
            createdAt: serverTimestamp(),
            isRead: false,
          });
        }

        onSuccess("Blog post updated successfully!");

      } else {
        // -------------------------------------------------
        // 2️⃣ CREATE NEW POST
        // -------------------------------------------------
        const newBlogRef = await addDoc(collection(db, "blogPosts"), {
          ...postData,
          createdAt: serverTimestamp(),
          views: 0,
          likes: 0,
        });

        // Only send notification if it's published
        if (form.status === "published") {
          await addDoc(collection(db, "notifications"), {
            type: "blog",
            title: form.title,
            message:
              form.excerpt.length > 120
                ? form.excerpt.substring(0, 120) + "..."
                : form.excerpt,
            image: form.featureImage,
            blog: {
              title: form.title,
              excerpt: form.excerpt,
              image: form.featureImage,
            },
            docId: newBlogRef.id,
            slug: form.slug,
            collection: "blogPosts",
            createdAt: serverTimestamp(),
            isRead: false,
          });
        }

        onSuccess("Blog post created successfully!");
      }

      resetForm();
      onRefresh();
    } catch (err) {
      console.error("Error saving post:", err);
      onError("Failed to save blog post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------
  // DELETE POST
  // -------------------------------------------------------------------
  const handleDelete = async (postId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    )
      return;

    try {
      await deleteDoc(doc(db, "blogPosts", postId));
      onSuccess("Blog post deleted successfully.");
      onRefresh();
    } catch (err) {
      console.error(err);
      onError("Failed to delete blog post.");
    }
  };

  // -------------------------------------------------------------------
  // TOGGLE PUBLISH STATUS (NO NOTIFICATION HERE TO KEEP SIMPLE)
  // -------------------------------------------------------------------
  const toggleStatus = async (post) => {
    try {
      const postRef = doc(db, "blogPosts", post.id);
      await updateDoc(postRef, {
        status: post.status === "published" ? "draft" : "published",
        updatedAt: serverTimestamp(),
      });
      onSuccess(
        `Post ${
          post.status === "published" ? "unpublished" : "published"
        }!`
      );
      onRefresh();
    } catch (err) {
      console.error(err);
      onError("Failed to update post status.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const d =
      timestamp?.toDate?.() || new Date(timestamp.seconds * 1000 || timestamp);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { class: "published", label: "Published" },
      draft: { class: "draft", label: "Draft" },
    };
    return statusConfig[status] || statusConfig.draft;
  };

  // -------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------
  return (
    <div className="manage-blog">
      {/* Form Section */}
      <div className="blog-form-card">
        <div className="card-header">
          <h3>{editingPost ? "Edit Blog Post" : "Create New Blog Post"}</h3>
          {editingPost && (
            <button
              className="btn btn--secondary btn--sm"
              onClick={resetForm}
            >
              <i className="fas fa-plus"></i>
              New Post
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="blog-form">
          {/* Tabs */}
          <div className="form-tabs">
            <button
              type="button"
              className={`tab-btn ${
                activeTab === "content" ? "active" : ""
              }`}
              onClick={() => setActiveTab("content")}
            >
              <i className="fas fa-edit"></i>
              Content
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "seo" ? "active" : ""}`}
              onClick={() => setActiveTab("seo")}
            >
              <i className="fas fa-search"></i>
              SEO
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "images" ? "active" : ""}`}
              onClick={() => setActiveTab("images")}
            >
              <i className="fas fa-images"></i>
              Media
            </button>
          </div>

          <div className="tab-content">
            {/* CONTENT TAB */}
            {activeTab === "content" && (
              <div className="tab-pane active">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title">Post Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={form.title}
                      onChange={handleInputChange}
                      placeholder="Enter a compelling title..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="slug">URL Slug *</label>
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      value={form.slug}
                      onChange={handleSlugChange}
                      placeholder="url-slug-for-seo"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      name="category"
                      value={form.category}
                      onChange={handleInputChange}
                    >
                      <option value="general">General</option>
                      <option value="technology">Technology</option>
                      <option value="lifestyle">Lifestyle</option>
                      <option value="business">Business</option>
                      <option value="health">Health & Wellness</option>
                      <option value="travel">Travel</option>
                      <option value="food">Food</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="readTime">Read Time (minutes)</label>
                    <input
                      type="number"
                      id="readTime"
                      name="readTime"
                      value={form.readTime}
                      onChange={handleInputChange}
                      placeholder="5"
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="excerpt">Excerpt *</label>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    rows="3"
                    value={form.excerpt}
                    onChange={handleInputChange}
                    placeholder="Write a compelling summary that will appear in blog listings..."
                    required
                  ></textarea>
                  <div className="char-count">{form.excerpt.length}/160</div>
                </div>

                <div className="form-group">
                  <label htmlFor="content">Content *</label>
                  <textarea
                    id="content"
                    name="content"
                    rows="12"
                    value={form.content}
                    onChange={handleInputChange}
                    placeholder="Write your blog post here... You can use Markdown formatting."
                    required
                  ></textarea>
                  <div className="editor-tools">
                    <span className="word-count">
                      {form.content.trim()
                        ? form.content.trim().split(/\s+/).length
                        : 0}{" "}
                      words
                    </span>
                    <div className="tool-buttons">
                      {/* You can add buttons for bold/italic etc later */}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEO TAB */}
            {activeTab === "seo" && (
              <div className="tab-pane active">
                <div className="form-group">
                  <label htmlFor="metaTitle">Meta Title</label>
                  <input
                    type="text"
                    id="metaTitle"
                    name="metaTitle"
                    value={form.metaTitle}
                    onChange={handleInputChange}
                    placeholder="SEO title for search engines"
                  />
                  <div className="char-count">{form.metaTitle.length}/60</div>
                </div>

                <div className="form-group">
                  <label htmlFor="metaDescription">Meta Description</label>
                  <textarea
                    id="metaDescription"
                    name="metaDescription"
                    rows="3"
                    value={form.metaDescription}
                    onChange={handleInputChange}
                    placeholder="SEO description for search engines"
                  ></textarea>
                  <div className="char-count">
                    {form.metaDescription.length}/160
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="tags">Tags</label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={form.tags}
                    onChange={handleInputChange}
                    placeholder="tag1, tag2, tag3 (comma separated)"
                  />
                  <div className="field-help">
                    Separate tags with commas. Example: "fashion, spring
                    trends, 2024"
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="author">Author</label>
                    <input
                      type="text"
                      id="author"
                      name="author"
                      value={form.author}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={form.status}
                      onChange={handleInputChange}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* IMAGES TAB */}
            {activeTab === "images" && (
              <div className="tab-pane active">
                {/* Feature Image */}
                <div className="image-upload-section">
                  <h4>Feature Image *</h4>
                  <div className="image-upload-preview">
                    {form.featureImage ? (
                      <div className="preview-with-actions">
                        <img
                          src={form.featureImage}
                          alt="Feature preview"
                        />
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              featureImage: "",
                            }))
                          }
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <i className="fas fa-cloud-upload-alt"></i>
                        <p>Upload feature image</p>
                        <span>Recommended: 1200x630px</span>
                      </div>
                    )}
                    <input
                      type="file"
                      id="featureImage"
                      accept="image/*"
                      onChange={handleFeatureImageUpload}
                      disabled={isUploading}
                    />
                    {isUploading && (
                      <div className="upload-progress">
                        <div
                          className="progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                        <span>Uploading... {uploadProgress}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Images */}
                <div className="image-upload-section">
                  <div className="section-header">
                    <h4>Content Images</h4>
                    <div className="file-input-wrapper">
                      <input
                        type="file"
                        id="contentImages"
                        accept="image/*"
                        multiple
                        onChange={handleContentImagesUpload}
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="contentImages"
                        className="btn btn--primary btn--sm"
                      >
                        <i className="fas fa-plus"></i>
                        Add Images
                      </label>
                    </div>
                  </div>

                  {contentImages.length > 0 ? (
                    <div className="content-images-grid">
                      {contentImages.map((image) => (
                        <div
                          key={image.id}
                          className="content-image-item"
                        >
                          <img src={image.url} alt={image.alt} />
                          <div className="image-actions">
                            <button
                              type="button"
                              className="btn-insert"
                              onClick={() =>
                                insertImageIntoContent(
                                  image.url,
                                  image.alt
                                )
                              }
                            >
                              <i className="fas fa-plus"></i>
                              Insert
                            </button>
                            <button
                              type="button"
                              className="btn-remove"
                              onClick={() =>
                                removeContentImage(image.id)
                              }
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Image caption..."
                            value={image.caption}
                            onChange={(e) =>
                              updateImageCaption(
                                image.id,
                                e.target.value
                              )
                            }
                            className="image-caption"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-images">
                      <i className="fas fa-images"></i>
                      <p>No content images yet</p>
                      <span>Upload images to insert into your post</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  {editingPost ? "Updating..." : "Publishing..."}
                </>
              ) : (
                <>
                  <i
                    className={`fas ${
                      editingPost ? "fa-save" : "fa-paper-plane"
                    }`}
                  ></i>
                  {editingPost ? "Update Post" : "Publish Post"}
                </>
              )}
            </button>

            {editingPost && (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={resetForm}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Posts List Section */}
      <div className="blog-list-card">
        <div className="card-header">
          <h3>Blog Posts ({posts.length})</h3>
          <div className="list-controls">
            <span className="stats">
              {posts.filter((p) => p.status === "published").length}{" "}
              published,{" "}
              {posts.filter((p) => p.status === "draft").length} draft
            </span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading blog posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <h4>No Blog Posts Yet</h4>
            <p>Create your first blog post to get started!</p>
          </div>
        ) : (
          <div className="blog-list">
            {posts.map((post) => {
              const status = getStatusBadge(post.status);
              return (
                <div key={post.id} className="blog-list-item">
                  <div className="post-image">
                    <img src={post.featureImage} alt={post.title} />
                    <span
                      className={`status-badge status--${status.class}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="post-content">
                    <h4 className="post-title">{post.title}</h4>
                    <p className="post-excerpt">{post.excerpt}</p>

                    <div className="post-meta">
                      <span className="meta-item">
                        <i className="fas fa-user"></i>
                        {post.author}
                      </span>
                      <span className="meta-item">
                        <i className="fas fa-clock"></i>
                        {post.readTime || "5"} min read
                      </span>
                      <span className="meta-item">
                        <i className="fas fa-calendar"></i>
                        {formatDate(post.updatedAt || post.createdAt)}
                      </span>
                      {post.category && (
                        <span className="meta-item category">
                          <i className="fas fa-tag"></i>
                          {post.category}
                        </span>
                      )}
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="post-tags">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="tag-pill">
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="tag-more">
                            +{post.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="post-actions">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => setEditingPost(post)}
                      >
                        <i className="fas fa-edit"></i>
                        Edit
                      </button>
                      <button
                        className={`btn-action btn-status ${
                          post.status === "published"
                            ? "btn-unpublish"
                            : "btn-publish"
                        }`}
                        onClick={() => toggleStatus(post)}
                      >
                        <i
                          className={`fas ${
                            post.status === "published"
                              ? "fa-eye-slash"
                              : "fa-eye"
                          }`}
                        ></i>
                        {post.status === "published"
                          ? "Unpublish"
                          : "Publish"}
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(post.id)}
                      >
                        <i className="fas fa-trash"></i>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBlog;
