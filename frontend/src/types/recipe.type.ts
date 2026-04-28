type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

type SortOrder = 'asc' | 'desc';

type RecipeSortField = 'createdAt' | 'averageScore' | 'viewCount' | 'title';

interface IngredientDTO {
  name: string;
  quantityText: string;
  unit?: string;
  isOptional?: boolean;
}

interface InstructionDTO {
  stepNumber: number;
  description: string;
}

interface NewRecipeData {
  title: string;
  description: string;
  ingredients: IngredientDTO[];
  instructions: InstructionDTO[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty?: Difficulty;
  categoryId: string;
  dietaryTagIds?: string[];
  isPublished?: boolean;
}

interface UpdateRecipeData extends Partial<NewRecipeData> {
  id: string;
}

interface RecipeQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  difficulty?: Difficulty;
  search?: string;
  authorId?: string;
  sortBy?: RecipeSortField;
  sortOrder?: SortOrder;
  minRating?: number;
  maxPrepTime?: number;
  dietaryTagIds?: string[];
}

interface RatingDTO {
  score: number; // 1-5
}

interface CommentDTO {
  content: string;
}

interface RecipeAuthor {
  id: string;
  username: string;
  avatarUrl: string;
  isOnline?: boolean;
}

interface RecipeCategory {
  id: string;
  name: string;
  slug: string;
}

interface RecipeImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface RecipeDietaryTag {
  id: string;
  name: string;
  slug: string;
}

interface RecipeIngredient {
  id: string;
  name: string;
  quantityText: string;
  isOptional: boolean;
  sortOrder: number;
}

interface RecipeInstruction {
  id: string;
  stepNumber: number;
  description: string;
}

interface RecipeResponse {
  id: string;
  title: string;
  slug: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: Difficulty;
  viewCount: number;
  averageScore: number;
  ratingCount: number;
  isPublished: boolean;
  isFavorite?: boolean;
  userRating?: number;
  createdAt: string;
  updatedAt: string;
  author: RecipeAuthor;
  category: RecipeCategory;
  images: RecipeImage[];
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  dietaryTags: RecipeDietaryTag[];
}

interface RecipeSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: Difficulty;
  averageScore: number;
  ratingCount: number;
  commentCount?: number;
  isFavorite?: boolean;
  createdAt: string;
  author: RecipeAuthor;
  category: RecipeCategory;
  primaryImage: RecipeImage | null;
  images?: RecipeImage[];
  dietaryTags: RecipeDietaryTag[];
}

interface RecipeComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: RecipeAuthor;
  replies?: RecipeComment[];
  replyCount?: number;
}

interface RecipeRating {
  id: string;
  score: number;
  userId: string;
  recipeId: string;
  createdAt: string;
}

interface RatingStats {
  averageScore: number;
  ratingCount: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginatedResponse<T> {
  status: 'success';
  message: string;
  data: T[];
  pagination: PaginationMeta;
}

export type {
  Difficulty,
  SortOrder,
  RecipeSortField,
  IngredientDTO,
  InstructionDTO,
  NewRecipeData,
  UpdateRecipeData,
  RecipeQueryParams,
  RatingDTO,
  CommentDTO,
  RecipeAuthor,
  RecipeCategory,
  RecipeImage,
  RecipeDietaryTag,
  RecipeIngredient,
  RecipeInstruction,
  RecipeResponse,
  RecipeSummary,
  RecipeComment,
  RecipeRating,
  RatingStats,
  ApiResponse,
  PaginationMeta,
  PaginatedResponse,
};