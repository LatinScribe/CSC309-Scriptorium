import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { SessionContext } from "@/contexts/session";
import { BlogPost, Comment } from "@/utils/types";
import { fetchBlogPost, fetchComments, fetchCommentbyId, postComment, rateBlog, rateComment, reportBlog, reportComment } from "@/utils/dataInterface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import Link from "next/link";

import { toast } from "sonner";
// import { formatDate } from "@/utils/format";
import { ExclamationTriangleIcon, ThickArrowDownIcon, ThickArrowUpIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import ReportDialog from "../pages/reportDialog";
import { render } from "react-dom";
import UserCard from "../usercard";

const BlogPostPage = () => {
    const router = useRouter();
    const { session } = useContext(SessionContext);
    // const [postId, setPostId] = useState<string | null>(null);    // get blog id
    const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    // const [loading, setLoading] = useState(true);

    const [sortOption, setSortOption] = useState<"newest" | "mostUpvotes" | "mostDownvotes">("newest");
    const [repliesText, setRepliesText] = useState<{ [key: number]: string }>({});  // maintain reply text for each comment separately
    const [activeReplies, setActiveReplies] = useState<Record<number, boolean>>({});

    const [blogVote, setBlogVote] = useState<"upvoted" | "downvoted" | null>(null);
    const [commentVotes, setCommentVotes] = useState<Record<number, "upvoted" | "downvoted" | null>>({});
    // pagination 
    const [currentPage, setCurrentPage] = useState(1); // Track the current page
    const [loading, setLoading] = useState(false); // To show loading state
    const [hasMore, setHasMore] = useState(true); // Track if there are more comments
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(20);

    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false); // Controls Post Report Dialog
    // mapping to store the state for each comment; key is commentID
    const [activeDialogs, setActiveDialogs] = useState<{ [commentId: number]: boolean }>({}); 
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null); // post/comment selected for reporting
    const [selectedReportType, setSelectedReportType] = useState("blog"); // Type of report: "post" or "comment"

    
    const { id } = router.query;
    // const postId = id ? Number(id) : null;
    const postId = router.query.id ? Number(router.query.id) : null;


    useEffect(() => {
      // Wait for the router to be ready to make sure the query is populated
        if (!postId) {
            console.log("Couldn't load post");  
            return;
        }
      const fetchData = async () => {
        try {

            const responseBlog = await fetchBlogPost(postId);
            setBlogPost(responseBlog);

            const commentsResponse = await fetchComments(postId, sortOption, currentPage, session);
            const nestedComments = nestComments(commentsResponse.comments);
            setComments(nestedComments);
            setTotalPages(commentsResponse.totalPages);

        } catch (error) {
            console.error("Error fetching data:", error);
        } 
      };

      if (postId) {
          fetchData();
      }
        
    }, [router.isReady, router.query.id]);

    useEffect(() => {
      if (!postId) {
        console.log("Couldnt load post");  
        return;
      }
      // sorting
      const getComments = async () => {
        try {
          console.log("Fetching comments for post:", postId);
          const commentsResponse = await fetchComments(postId, sortOption, currentPage, session);
          if (Array.isArray(commentsResponse.comments)) {
            const nestedComments = nestComments(commentsResponse.comments);
            setComments(nestedComments);
          } else {
            console.error("Expected an array of comments, but got:", commentsResponse.comments);
            setComments([]); 
          }
        } catch(error) {
            console.error("Error fetching data:", error);
        } 
      };

      if (postId) {
        getComments();
      }

    }, [sortOption]); 
    
    // const loadMoreComments = async () => {
    //   if (!postId) {
    //     console.log("Invalid postId");  
    //     return;
    //   }

    //   if (currentPage < totalPages) {
    //     const nextPage = currentPage + 1;
    //     setCurrentPage(nextPage); 
    //     try{
    //       const newCommentsResponse = await fetchComments(postId, sortOption, currentPage, session);
    //       const newComments = newCommentsResponse.comments;
          
    //       setComments((prevComments) => [...prevComments, ...newComments]);
    //     } catch (error) {
    //       console.error("Failed to load more comments:", error);
    //       toast.error("Failed to load more comments.");
    //     }
    //   }

    // };
  

    const handleCommentSubmit = async () => {
      if (!session || !session.accessToken) {
        toast.error("Please sign in");
        return;
      }
      if (!newComment.trim()) {
          toast.error("Comment cannot be empty.");
          return;
      }
      try {
          const response = await postComment(Number(postId), newComment, null, session);
          if (!response) {
            toast.error("An error occurred. Pleas sign in again");
          }
          // setComments((prev) => [...prev, response]);
          setComments((prev) => [...prev, { ...response, author: session.user }]);
          setNewComment("");
          toast.success("Comment posted!");
      } catch (error) {
          console.error("Failed to post comment:", error);
          toast.error("Failed to post your comment.");
      }
    };

    const handleReplySubmit = async (parentCommentId: number, reply: string) => {
      if (!reply) return; // Don't allow empty replies
      if (!reply.trim()) {
          toast.error("Comment cannot be empty.");
          return;
      }
      try {
        if (session) {
          const replyResponse = await postComment(Number(postId), reply, parentCommentId, session);
          
          if (!replyResponse) {
            toast.error("An error occurred. Pleas sign in again");
          }

          // Refetch all comments to update tree
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === parentCommentId
                ? {
                    ...comment,
                    replies: [
                      ...(comment.replies || []),
                      { ...replyResponse, author: session.user }
                    ]
                  }
                : comment
            )
          );

          setActiveReplies((prev) => ({
            ...prev,
            [parentCommentId]: true,  
          }));
          
          renderComments(comments)
          toast.success("Reply posted!");
        }

      } catch (error) {
          console.error("Failed to post reply:", error);
          toast.error("Failed to post your reply.");
      }

    };


      const handleVote = async (type: "upvote" | "downvote", contentId: number, isBlog: boolean, parentCommentId?: number) => {
        if (!session || !session.accessToken) {
          toast.error("Please sign in");
          return;
        }
        try {
            // let response = null;
            if (isBlog) {
              let response = await rateBlog(contentId, type, session);
              if (response) {
                setBlogPost((prev) =>
                    prev ? {
                        ...prev,
                        upvoteCount: response.upvoteCount,
                        downvoteCount: response.downvoteCount
                    } : null
                );
                setBlogVote((prevVote) => {
                  return prevVote === "upvoted" && type === "upvote"
                      ? null
                      : prevVote === "downvoted" && type === "downvote"
                      ? null
                      : type === "upvote"
                      ? "upvoted"
                      : "downvoted";
                });
              }
            } else {
              let response = await rateComment(contentId, type, session);
              if (response) {
                setComments((prev) =>
                  prev.map((comment) =>
                      comment.id === contentId
                          ? {
                              ...comment,
                              upvoteCount: response.upvoteCount,
                              downvoteCount: response.downvoteCount,
                          }
                          : comment
                  )
                );
                setCommentVotes((prevVotes) => ({
                  ...prevVotes,
                  [contentId]: prevVotes[contentId] === "upvoted" && type === "upvote"
                      ? null
                      : prevVotes[contentId] === "downvoted" && type === "downvote"
                      ? null
                      : type === "upvote"
                      ? "upvoted"
                      : "downvoted",
                }));
              }
            }

        } catch (error) {
            toast.error(`Failed to post content.`);
        }
    };

    const handleReport = async (contentId: number, explanation: string, reportType: string) => {
        if (!session || !session.accessToken) {
            toast.error("Please sign in");
            return;
        }
        if (!explanation) {
          toast.error("Please provide an explanation.");
          return;
        }
          
        try {
          let response = null;
          if (reportType==="blog") {
            response = await reportBlog(contentId, explanation, session);
            
          } else if (reportType === "comment"){
            response = await reportComment(contentId, explanation, session);
          }
          
          
        } catch (error) {
            toast.error("Failed to report content.");
        }
    };

    const toggleReplies = (commentId: number) => {
      setActiveReplies((prev) => ({
          ...prev,
          [commentId]: !prev[commentId],
      }));
    };
  
    const openReportDialog = (type: string, id: number) => {
      if (!session || !session.accessToken) {
        toast.error("You must be signed in");
        return;
      }
      setSelectedReportType(type); // Set report type to either "post" or "comment"
      setSelectedReportId(id); 
      if (type === "blog") {
        setIsPostDialogOpen(true); 
      } else if (type === "comment" ) {
        setActiveDialogs((prev) => ({ ...prev, [id]: true }));
      }
    };

    const closeReportDialog = (type: string, id: number) => {

      if (type === "blog") {
        setIsPostDialogOpen(false);
      } else if (type === "comment" ) {
        setActiveDialogs((prev) => ({
          ...prev,
          [id]: false, 
        }));
      }

    };

    const handleReplyChange = (commentId: number, text: string) => {
      setRepliesText((prev) => ({
        ...prev,
        [commentId]: text,
      }));
    };

    // const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    //   setSortOption(e.target.value);
    // };

  
    const renderComments = (commentsList: any[]) =>
      commentsList.map((comment) => (
        <div key={comment.id} className="p-4 rounded-md my-2 bg-background-50">
          <div className="flex flex-col gap-2">
            {/* Hidden Badge for Comment */}
            {comment.hidden && (
              <div className="flex items-center gap-2 bg-yellow-100 p-2 rounded-md mb-4">
                <ExclamationTriangleIcon className="text-yellow-800" />
                <div className="text-sm text-yellow-800 font-semibold">
                  Your comment has been hidden. It cannot be seen by others.
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500 font-semibold">{comment.author?.username}</p>
              <span className="text-sm text-gray-400">•</span>
              <p className="text-sm text-gray-400">{new Date(comment.createdAt).toLocaleString()}</p> 
            </div>
            
            {/* Comment Content */}
            <p className="text-base mt-1">{comment.content}</p>
            
            <div className="flex gap-2 mt-2">
              <Button 
                onClick={() => handleVote("upvote", comment.id, false)} 
                variant="outline" 
                size="sm" 
                className="px-1 py-1 flex items-center"
                disabled={blogPost?.hidden}

              >
                <ThickArrowUpIcon /> {comment.upvoteCount}
              </Button>
              <Button 
                onClick={() => handleVote("downvote", comment.id, false)} 
                variant="outline" 
                size="sm"
                className="px-1 py-1 flex items-center"
                disabled={blogPost?.hidden}
              >
                <ThickArrowDownIcon /> {comment.downvoteCount}
              </Button>
              <Button 
                onClick={() => openReportDialog("comment", comment.id)} 
                variant="outline" 
                size="sm" 
                className="px-2 py-1 flex items-center space-x-1 ml-4"
                disabled={blogPost?.hidden}
              >
                <ExclamationTriangleIcon /> report
              </Button>
              {activeDialogs[comment.id] && (
                <ReportDialog
                  reportType={"comment"}
                  reportId={comment.id}
                  handleReport={handleReport}
                  // onCancel={() => closeReportDialog("comment", comment.id)}
                  // onClose={() => closeReportDialog("comment", comment.id)}
                />
              )}
            </div>
          </div>
    
          {/* Reply input */}
          <div className="flex items-center gap-2 mt-4">
            <Input
              value={repliesText[comment.id] || ""}
              onChange={(e) => handleReplyChange(comment.id, e.target.value)}
              placeholder="Write a reply..."
              className="flex-grow"
            />
            <Button
              onClick={() => {
                handleReplySubmit(comment.id, repliesText[comment.id]);
                setRepliesText((prev) => ({ ...prev, [comment.id]: "" })); // Clear reply text after submitting
              }}
              className="ml-2"
              disabled={blogPost?.hidden}
            >
              Reply
            </Button>
          </div>
    
          {/* Show/hide replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-sm text-gray-500 hover:underline"
              >
                {activeReplies[comment.id] ? "Hide Replies" : "Show Replies"}
              </button>
              {activeReplies[comment.id] && comment?.replies?.length > 0 && (
                <div className="mt-4 pl-4 border-l">
                  {renderComments(comment.replies)}
                  
                </div>
              )}
            </div>
          )}
        </div>
      ));

    return (
      <div className="mx-auto max-w-3xl p-4">
            {blogPost && (
                <div className="bg-white shadow-md rounded p-6 mb-6">

                  {blogPost.hidden && (
                    <div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-600 p-4 mb-4 flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <div>
                        <h3 className="font-semibold">Your post has been hidden.</h3>
                        <p className="text-sm">No one else can see your post. It has been flagged for review.</p>
                        <p className="text-sm">Your post has {blogPost.reportsCount || 0} reports.</p>
                      </div>
                    </div>
                  )}


                    <h1 className="text-2xl font-bold">{blogPost.title}</h1>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 text-gray-600 text-sm">By <UserCard user={blogPost.author} /></div>
                        <span className="text-sm text-gray-400">•</span>
                        <p className="text-gray-600 text-sm">{new Date(blogPost.createdAt).toLocaleString()}</p>
                      </div>
                    <div className="mt-4">{blogPost.description}</div>

                    {/* Code Templates Section */}
                    {blogPost && blogPost.codeTemplates && blogPost.codeTemplates.length > 0 && (
                      <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-3">Related Code Templates</h2>
                        <ul className="space-y-2 list-inside list-disc marker:text-slate-400">
                          {blogPost.codeTemplates.map((template) => (
                            <li key={template.id}>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Link
                                    href={`/templates/${template.id}`}
                                    className="font-medium hover:underline transition-colors underline"
                                  >
                                    <span className="truncate" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {template.title}
                                  </span>
                                  </Link>
                                </HoverCardTrigger>
                                <HoverCardContent className="max-w-xs sm:max-w-sm lg:max-w-lg">
                                  <h3 className="font-semibold text-lg">{template.title}</h3>
                                  {/* <p className="mt-2 text-sm text-slate-700">{template.explanation}</p> */}
                                  <div className="mt-2 flex flex-wrap gap-2">
                                  {(Array.isArray(template.tags) ? template.tags : []).map((tag, index) => (
                                    <span
                                        key={index}
                                        className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="mt-2 text-xs text-slate-500">Language: {template.language}</p>
                                </HoverCardContent>
                              </HoverCard>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    


                    <div className="mt-4 flex items-center gap-2">
                      <Button 
                        onClick={() => handleVote("upvote", blogPost.id, true)} variant="outline" size="sm"
                        disabled={blogPost.hidden}
                        >
                        <ThickArrowUpIcon/> {blogPost.upvoteCount}</Button>
                      <Button 
                        onClick={() => handleVote("downvote", blogPost.id, true)} 
                        variant="outline" 
                        size="sm"
                        disabled={blogPost.hidden}
                        >
                        <ThickArrowDownIcon/> {blogPost.downvoteCount}</Button>
                      <Button 
                        onClick={() => openReportDialog("blog", blogPost.id)} 
                        disabled={blogPost.hidden}
                        variant="outline" size="sm" className="px-2 py-1 flex items-center space-x-1 ml-4">
                        <ExclamationTriangleIcon/> report </Button>
                      {isPostDialogOpen && (
                        <ReportDialog
                          reportType={"blog"} // "blog" or "comment"
                          reportId={blogPost.id} 
                          handleReport={handleReport} // function to handel submitting report
                          // onClose={() => closeReportDialog("blog", blogPost.id)}
                          
                        />
                      )}
                                
                    </div>
                    
                </div>
            )}
            
            
            {/* Comments List */}
            {blogPost && (
              <div className="p-4 rounded">
                  <h2 className="text-lg font-bold mb-4">Comments</h2>
                  <div className="mb-4 flex">
                      <Input
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-grow"
                      />
                      <Button 
                        onClick={handleCommentSubmit} className="ml-2"
                        disabled={blogPost.hidden}>
                          Post
                      </Button>
                  </div>
                  

                  {/* Dropdown for Sorting Comments */}
                  <div className="p-4 flex justify-end items-center space-x-2">
                    <label 
                      htmlFor="sortComments" 
                      className="text-sm font-medium text-gray-700"
                    >
                      Sort comments:
                    </label>
                    <Select
                      value={sortOption}
                      onValueChange={(value: string) => setSortOption(value as "newest" | "mostUpvotes" | "mostDownvotes")}
                    >
                      <SelectTrigger className="w-32 border rounded-md px-3 py-2  ">
                        <SelectValue>
                          {
                            sortOption === 'mostUpvotes' ? 'Most Upvotes' :
                            sortOption === 'mostDownvotes' ? 'Most Downvotes' :
                            sortOption === 'newest' ? 'Newest' : 'Select Sort'
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border rounded-md bg-white shadow-lg mt-1">
                        <SelectItem value="newest" className="px-4 py-2 text-gray-700 hover:bg-gray-100">Newest</SelectItem>
                        <SelectItem value="mostUpvotes" className="px-4 py-2 text-gray-700 hover:bg-gray-100">Most Upvotes</SelectItem>
                        <SelectItem value="mostDownvotes" className="px-4 py-2 text-gray-700 hover:bg-gray-100">Most Downvotes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                  {comments.length > 0 ? (
                    renderComments(comments)
                    
                  ) : (     
                    <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                  )}
                  {/* Load More Button */}
                  {/* {(currentPage < totalPages) && (
                    <div className="flex justify-center mt-4">
                      <Button
                        onClick={loadMoreComments}
                        variant="outline"
                        size="sm"
                        className="px-4 py-2 text-blue-500"
                        disabled={loading} // Disable while loading
                      >
                        {loading ? "Loading..." : "Load More"}
                      </Button>
                    </div>
                  )} */}

                  
                  </div>
              </div>
            )}
        </div>
    );
}


const nestComments = (comments: Comment[]) => {
  const commentMap = new Map();


  comments.forEach((comment: Comment) => {
    comment.replies = []; 
    commentMap.set(comment.id, comment);
  });

  const roots: Comment[] = [];

  comments.forEach((comment) => {
    if (comment.parentCommentId) {
      // attach as a reply to its parent
      const parent = commentMap.get(comment.parentCommentId);
      if (parent) {
        parent.replies.push(comment);
      }
    } else { // top level comment
      roots.push(comment);
    }
  });

  return roots; // only returns top level comments
};

export default BlogPostPage;







