/**
 * Internationalization (i18n) module for multi-language support
 */

export type Language = 'en' | 'vi';

export interface Translation {
  [key: string]: string | Translation;
}

// Only support these languages for now
export const SUPPORTED_LANGUAGES: Language[] = ['en', 'vi'];

export const translations: Record<Language, Translation> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.storybooks': 'Storybooks',
    'nav.storyverses': 'Storyverses',
    'nav.characters': 'Characters',
    'nav.search_placeholder': 'Search stories, authors, characters...',
    
    // Theme
    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'theme.system': 'System',
    'theme.toggle': 'Toggle theme',
    
    // User Menu
    'menu.profile': 'Profile',
    'menu.settings': 'Settings',
    'menu.notifications': 'Notifications',
    'menu.creator': 'Creator',
    'menu.admin': 'Admin',
    'menu.logout': 'Logout',
    'menu.login': 'Login',
    'menu.signup': 'Sign Up',
    
    // Profile
    'profile.display_name': 'Display Name',
    'profile.username': 'Username',
    'profile.bio': 'Bio',
    'profile.join_date': 'Joined',
    'profile.followers': 'Followers',
    'profile.following': 'Following',
    'profile.storybooks': 'Storybooks',
    'profile.storyverses': 'Storyverses',
    'profile.characters': 'Characters',
    'profile.created_storybooks': 'Created Storybooks',
    'profile.created_storyverses': 'Created Storyverses',
    'profile.created_characters': 'Created Characters',
    'profile.no_storybooks': 'No storybooks yet.',
    'profile.no_storyverses': 'No storyverses yet.',
    'profile.no_characters': 'No characters created yet.',
    'profile.follow': 'Follow',
    'profile.unfollow': 'Unfollow',
    'profile.edit_profile': 'Edit Profile',
    
    // Settings
    'settings.title': 'Personal Settings',
    'settings.description': 'Edit your profile, toggle creator mode, and manage API security.',
    'settings.account_info': 'Account Information',
    'settings.display_name': 'Display Name',
    'settings.creator_mode': 'Activate "Creator" Mode',
    'settings.creator_mode_desc': 'When disabled, the "Creator" menu item will be hidden from the navigation bar.',
    'settings.ai_author_name': 'AI Author Name',
    'settings.ai_author_name_desc': 'Name displayed when using AI to assist in writing content.',
    'settings.bio': 'Bio',
    'settings.bio_placeholder': 'Short introduction about you... (optional)',
    'settings.avatar': 'Avatar URL',
    'settings.avatar_placeholder': 'https://... (optional)',
    'settings.save': 'Save Changes',
    'settings.success': 'Settings updated successfully!',
    'settings.error': 'An error occurred.',
    
    // API & Security
    'settings.security': 'Security & MCP API',
    'settings.api_desc': 'To use the Model Context Protocol (MCP) or call sensitive system APIs from AI, you must provide your personal API Token.',
    'settings.current_token': 'Current API Token',
    'settings.copy_token': 'Copy',
    'settings.generate_token': 'Generate New API Token',
    'settings.regenerate_token': 'Regenerate Token (Revoke Old)',
    'settings.no_token': 'No API Token created',
    'settings.token_copied': 'API Token copied!',
    'settings.confirm_revoke': 'Creating a new token will immediately revoke the old one. Confirm?',
    
    // Language
    'settings.language': 'Language',
    'settings.language_desc': 'Select your preferred language for the interface.',
    'language.en': 'English',
    'language.vi': 'Vietnamese',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.no_notifications': 'No notifications',
    'notifications.mark_read': 'Mark as read',
    'notifications.mark_all_read': 'Mark all as read',
    
    // Creator
    'creator.title': 'Creator Dashboard',
    'creator.create_storybook': 'Create Storybook',
    'creator.create_storyverse': 'Create Storyverse',
    'creator.create_character': 'Create Character',
    'creator.manage_content': 'Manage Content',
    
    // Admin
    'admin.title': 'Admin Panel',
    'admin.users': 'Users',
    'admin.content': 'Content',
    'admin.settings': 'Settings',
    
    // Search
    'search.title': 'Search Results',
    'search.no_results': 'No results found',
    'search.for': 'Search results for',
    
    // Storybook
    'storybook.chapters': 'Chapters',
    'storybook.read': 'Read',
    'storybook.author': 'Author',
    'storybook.published': 'Published',
    'storybook.updated': 'Updated',
    
    // Storyverse
    'storyverse.description': 'Description',
    'storyverse.books': 'Books',
    'storyverse.characters': 'Characters',
    
    // Character
    'character.storyverse': 'Storyverse',
    'character.details': 'Details',
    
    // Forms
    'form.required': 'This field is required',
    'form.invalid_email': 'Invalid email address',
    'form.password_mismatch': 'Passwords do not match',
    'form.min_length': 'Must be at least {{min}} characters',
    'form.max_length': 'Must be at most {{max}} characters',
    
    // Auth
    'auth.login_title': 'Login to Storybook',
    'auth.signup_title': 'Create Account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm Password',
    'auth.remember_me': 'Remember me',
    'auth.forgot_password': 'Forgot password?',
    'auth.no_account': "Don't have an account?",
    'auth.have_account': 'Already have an account?',
  },
  vi: {
    // Navigation
    'nav.home': 'Trang chủ',
    'nav.storybooks': 'Bộ truyện',
    'nav.storyverses': 'Vũ trụ truyện',
    'nav.characters': 'Nhân vật',
    'nav.search_placeholder': 'Tìm truyện, tác giả, nhân vật...',
    
    // Theme
    'theme.dark': 'Tối',
    'theme.light': 'Sáng',
    'theme.system': 'Hệ thống',
    'theme.toggle': 'Chuyển chế độ giao diện',
    
    // User Menu
    'menu.profile': 'Hồ sơ',
    'menu.settings': 'Cài đặt',
    'menu.notifications': 'Thông báo',
    'menu.creator': 'Nhà sáng tạo',
    'menu.admin': 'Quản trị',
    'menu.logout': 'Đăng xuất',
    'menu.login': 'Đăng nhập',
    'menu.signup': 'Đăng ký',
    
    // Profile
    'profile.display_name': 'Tên hiển thị',
    'profile.username': 'Tên người dùng',
    'profile.bio': 'Giới thiệu',
    'profile.join_date': 'Tham gia ngày',
    'profile.followers': 'Người theo dõi',
    'profile.following': 'Đang theo dõi',
    'profile.storybooks': 'Bộ truyện',
    'profile.storyverses': 'Vũ trụ',
    'profile.characters': 'Nhân vật',
    'profile.created_storybooks': 'Bộ truyện đã sáng tác',
    'profile.created_storyverses': 'Vũ trụ đã sáng tạo',
    'profile.created_characters': 'Nhân vật đã tạo',
    'profile.no_storybooks': 'Chưa có truyện nào.',
    'profile.no_storyverses': 'Chưa có vũ trụ nào.',
    'profile.no_characters': 'Chưa tạo nhân vật nào.',
    'profile.follow': 'Theo dõi',
    'profile.unfollow': 'Bỏ theo dõi',
    'profile.edit_profile': 'Chỉnh sửa hồ sơ',
    
    // Settings
    'settings.title': 'Cài Đặt Cá Nhân',
    'settings.description': 'Hiệu chỉnh hồ sơ cá nhân, bật tắt quyền sáng tác và quản lý bảo mật API.',
    'settings.account_info': 'Thông tin tài khoản',
    'settings.display_name': 'Tên hiển thị (Display Name)',
    'settings.creator_mode': 'Kích hoạt quyền "Nhà sáng tạo"',
    'settings.creator_mode_desc': 'Khi tắt quyền này, mục "Nhà sáng tạo" trên thanh điều hướng sẽ bị ẩn.',
    'settings.ai_author_name': 'Tên tác giả AI',
    'settings.ai_author_name_desc': 'Tên hiển thị khi sử dụng AI để hỗ trợ viết nội dung.',
    'settings.bio': 'Giới thiệu (Bio)',
    'settings.bio_placeholder': 'Giới thiệu ngắn về bạn... (có thể bỏ trống)',
    'settings.avatar': 'Ảnh đại diện (Avatar URL)',
    'settings.avatar_placeholder': 'https://... (có thể bỏ trống)',
    'settings.save': 'Lưu thay đổi',
    'settings.success': 'Cập nhật cài đặt thành công!',
    'settings.error': 'Có lỗi xảy ra.',
    
    // API & Security
    'settings.security': 'Bảo mật & Cổng MCP API',
    'settings.api_desc': 'Để sử dụng Giao thức Model Context Protocol (MCP) hoặc gọi các API nhạy cảm của hệ thống từ AI, bạn bắt buộc phải truyền API Token cá nhân của mình.',
    'settings.current_token': 'API Token hiện tại',
    'settings.copy_token': 'Sao chép',
    'settings.generate_token': 'Khởi tạo API Token mới',
    'settings.regenerate_token': 'Tái tạo Token mới (Revoke cũ)',
    'settings.no_token': 'Chưa tạo API Token',
    'settings.token_copied': 'Đã sao chép API Token của bạn!',
    'settings.confirm_revoke': 'Tạo Token mới sẽ dập tắt và làm vô hiệu hóa token cũ ngay lập tức. Xác nhận?',
    
    // Language
    'settings.language': 'Ngôn ngữ',
    'settings.language_desc': 'Chọn ngôn ngữ ưa thích cho giao diện.',
    'language.en': 'Tiếng Anh',
    'language.vi': 'Tiếng Việt',
    
    // Common
    'common.loading': 'Đang tải...',
    'common.error': 'Lỗi',
    'common.cancel': 'Hủy',
    'common.confirm': 'Xác nhận',
    'common.delete': 'Xóa',
    'common.edit': 'Chỉnh sửa',
    'common.create': 'Tạo mới',
    'common.back': 'Quay lại',
    'common.next': 'Tiếp theo',
    'common.previous': 'Trước',
    
    // Notifications
    'notifications.title': 'Thông báo',
    'notifications.no_notifications': 'Không có thông báo',
    'notifications.mark_read': 'Đánh dấu đã đọc',
    'notifications.mark_all_read': 'Đánh dấu tất cả đã đọc',
    
    // Creator
    'creator.title': 'Bảng điều khiển Nhà sáng tạo',
    'creator.create_storybook': 'Tạo Bộ truyện',
    'creator.create_storyverse': 'Tạo Vũ trụ',
    'creator.create_character': 'Tạo Nhân vật',
    'creator.manage_content': 'Quản lý nội dung',
    
    // Admin
    'admin.title': 'Bảng điều khiển Quản trị',
    'admin.users': 'Người dùng',
    'admin.content': 'Nội dung',
    'admin.settings': 'Cài đặt',
    
    // Search
    'search.title': 'Kết quả tìm kiếm',
    'search.no_results': 'Không tìm thấy kết quả',
    'search.for': 'Kết quả tìm kiếm cho',
    
    // Storybook
    'storybook.chapters': 'Chương',
    'storybook.read': 'Đọc',
    'storybook.author': 'Tác giả',
    'storybook.published': 'Xuất bản',
    'storybook.updated': 'Cập nhật',
    
    // Storyverse
    'storyverse.description': 'Mô tả',
    'storyverse.books': 'Sách',
    'storyverse.characters': 'Nhân vật',
    
    // Character
    'character.storyverse': 'Vũ trụ',
    'character.details': 'Chi tiết',
    
    // Forms
    'form.required': 'Trường này là bắt buộc',
    'form.invalid_email': 'Địa chỉ email không hợp lệ',
    'form.password_mismatch': 'Mật khẩu không khớp',
    'form.min_length': 'Phải có ít nhất {{min}} ký tự',
    'form.max_length': 'Phải có tối đa {{max}} ký tự',
    
    // Auth
    'auth.login_title': 'Đăng nhập vào Storybook',
    'auth.signup_title': 'Tạo tài khoản',
    'auth.email': 'Email',
    'auth.password': 'Mật khẩu',
    'auth.confirm_password': 'Xác nhận mật khẩu',
    'auth.remember_me': 'Ghi nhớ tôi',
    'auth.forgot_password': 'Quên mật khẩu?',
    'auth.no_account': 'Chưa có tài khoản?',
    'auth.have_account': 'Đã có tài khoản?',
  }
};

/**
 * Get translation for a key
 * @param key - Translation key (dot notation supported, e.g., 'nav.home')
 * @param lang - Language code ('en' or 'vi')
 * @param params - Optional parameters for template replacement
 */
export function t(key: string, lang: Language = 'vi', params?: Record<string, string>): string {
  const keys = key.split('.');
  let value: string | Translation | undefined = translations[lang];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if key not found
      value = translations['en'][key];
      break;
    }
  }
  
  let result = typeof value === 'string' ? value : key;
  
  // Replace parameters
  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(`{{${paramKey}}}`, paramValue);
    }
  }
  
  return result;
}

/**
 * Get the default language from user preference or system
 */
export function getDefaultLanguage(): Language {
  // This would typically come from user settings or cookies
  // For now, default to Vietnamese
  return 'vi';
}

/**
 * Check if a language is supported
 */
export function isSupportedLanguage(lang: string): lang is Language {
  return SUPPORTED_LANGUAGES.includes(lang as Language);
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): { code: Language; name: string }[] {
  return [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' }
  ];
}

/**
 * Validate and normalize language code
 */
export function normalizeLanguage(lang: string | null | undefined): Language {
  if (!lang) return 'vi';
  const normalized = lang.toLowerCase();
  return isSupportedLanguage(normalized) ? (normalized as Language) : 'vi';
}
