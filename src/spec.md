# Cloud Jump 2D Game

## Overview
A complete Doodle Jump clone with identical gameplay mechanics to the original. The game is developed entirely in the frontend, with optional backend data storage for authenticated users.

## Authentication and Progress
- **Internet Identity Integration**: Users can log in with Internet Identity
- **Guest Mode**: Instant play without login, no progress is saved
- **Persistent Data Storage**: For logged-in users, XP, current level, prestige level, highest score, Clouds currency, join date, and progress are stored in the backend with reliable synchronization
- **Level System**: 100 levels with specific XP requirements for each level transition
- **Height-Based XP**: XP is awarded based on the player's vertical height progress in the game, with each height unit corresponding to 1 XP
- **Progress Synchronization**: Real-time updates between frontend and backend ensure consistent progress tracking

## Prestige System
- **Prestige Activation**: The prestige system activates only once the player fully reaches Level 100; before that, it remains completely hidden from all UI
- **Automatic Prestige Entry**: Upon achieving Level 100, the player automatically becomes Prestige 1
- **Prestige Progression**: Players can progress up to Prestige 10 with specific XP requirements:
  - Prestige 1 → 2: 2,000,000 XP
  - Prestige 2 → 3: 5,000,000 XP
  - Prestige 3 → 4: 10,000,000 XP
  - Prestige 4 → 5: 25,000,000 XP
  - Prestige 5 → 6: 50,000,000 XP
  - Prestige 6 → 7: 100,000,000 XP
  - Prestige 7 → 8: 250,000,000 XP
  - Prestige 8 → 9: 500,000,000 XP
  - Prestige 9 → 10: 1,000,000,000 XP
- **Continuous XP Accumulation**: Once in prestige mode, XP continues accruing as normal based on height achievements, following the prestige thresholds
- **Prestige Display**: Current Prestige Level is shown in Profile, Leaderboard, and relevant Game UI sections in premium style consistent with the futuristic Cloud Jump interface
- **Authenticated Users Only**: Prestige system is available exclusively to logged-in users and does not appear for guests
- **Backend Prestige Storage**: Backend stores prestige level for each authenticated user with reliable persistence and synchronization

## In-Game Currency System
- **Cloud Currency**: An in-game currency called "Clouds" earned through height progression
- **Cloud Earning Logic**: Players earn 1 Cloud for every 2500 height points reached
- **Height-to-Cloud Conversion**: Cloud calculation is based on cumulative height achieved across all gameplay sessions
- **Cloud Persistence**: Clouds are saved in the backend for authenticated users only
- **Guest Mode Clouds**: Guest players see temporary Cloud count during gameplay but it's not persisted between sessions
- **Cloud Updates**: Cloud calculations and awards occur when gameplay ends alongside XP and statistics updates
- **Progress Tracking**: Both current Cloud count and progress toward next Cloud are tracked and displayed

## XP and Height System
- **Height-to-XP Conversion**: Each height unit achieved in the game equals 1 XP point
- **Session-Based XP Calculation**: XP is calculated from the highest height reached during each game session
- **XP Award Logic**: When a game session ends, XP equal to the highest height achieved is awarded to the player
- **Height Reset Handling**: When player height resets (on fall or new game), XP calculation uses the maximum height achieved in that completed session
- **Cumulative XP**: Total XP accumulates across all gameplay sessions for logged-in users
- **Guest Mode XP**: Guest players see temporary XP based on height but it's not persisted between sessions

## Level Progression System
- **Level 1 to Level 2**: Requires 2,000 XP
- **Levels 2-89**: XP requirements increase gradually from the base 2,000 XP
- **Levels 90-100**: Each level requires an additional 20,000 XP beyond the previous level
- **XP Accumulation**: Total XP accumulates across all gameplay sessions for logged-in users based on height achievements
- **Level Calculation**: Backend and frontend logic calculates current level based on total accumulated XP using the specific XP thresholds
- **Progress Tracking**: Both guest mode (temporary) and authenticated users (persistent) track XP and level progression based on height
- **Reliable XP Saving**: XP gained from height achievements in each game session is consistently saved to backend for authenticated users
- **Progress Retention**: All XP, level progression, prestige progression, and high scores are retained between sessions for logged-in players

## Global Leaderboard System
- **Leaderboard Button**: A "Leaderboard" button positioned next to the existing "Clan" and "Profile" buttons in the top-right corner area of the Home screen, visible only to logged-in Internet Identity users
- **Global High Score Tracking**: Backend stores and tracks the highest score achieved by each authenticated user across all game sessions
- **Score-Based Ranking**: Global leaderboard displays all Internet Identity users sorted by their highest score in descending order
- **Leaderboard Data Display**: Each leaderboard entry shows the player's Principal ID, highest score, current level, and prestige level (if applicable) based on their accumulated XP
- **Fullscreen Leaderboard Modal**: Opens a fully responsive fullscreen overlay with no visible borders that covers the entire viewport with fluid scaling on all devices (mobile and desktop)
- **Leaderboard Modal Design**:
  - **Fully Opaque Blurred Background**: Solid semi-transparent dark overlay combined with backdrop blur that completely prevents any menu or game elements from showing through while maintaining the clean, futuristic Cloud Jump style
  - Scrollable list of players ranked by highest score in descending order
  - Each entry displays Principal ID, highest score, level, and prestige level (if applicable) in a clean, card-based layout
  - Close button (X) in the top-right corner to dismiss the modal and return to the Home screen
- **Backend High Score Storage**: Backend stores each player's highest score achieved and updates it when a new personal best is reached
- **Cross-Identity Leaderboard Access**: Backend provides leaderboard data for all Internet Identity users across all canister instances, not limited to the current user's canister
- **Real-time Leaderboard Updates**: Leaderboard data is fetched from backend using React Query integration for real-time synchronization
- **Futuristic UI Style**: Consistent with Cloud Jump aesthetic featuring glowing headings, clean card design, soft gradients, and subtle shadows
- **Mobile Responsive**: Leaderboard interface is fully responsive and performs smoothly on mobile devices
- **Robust Error Handling**: Leaderboard system includes proper error handling for data fetching with user feedback
- **Language**: All content in English

## Player Statistics Modal System
- **Player Name Click Handlers**: Clickable player names in Chat, Clan, and Leaderboard interfaces that open detailed player statistics
- **Player Stats Modal Access**: When a player name is clicked in ChatModal, ClanModal, or LeaderboardModal, opens a Player Stats Modal displaying detailed information for that player
- **Player Stats Modal Design**:
  - **Fullscreen Player Stats Interface**: Opens a fully responsive fullscreen overlay with no visible borders that covers the entire viewport with fluid scaling on all devices (mobile and desktop)
  - **Fully Opaque Blurred Background**: Solid semi-transparent dark overlay combined with backdrop blur that completely prevents any menu or game elements from showing through while maintaining the clean, futuristic Cloud Jump style
  - **Player Information Display**: Shows Principal ID, current level, prestige level (if applicable), total XP, highest score (highest height), total Clouds currency balance, and join date formatted as "Joined dd.mm.yyyy"
  - Close button (X) in the top-right corner to dismiss the modal and return to the previous interface
- **Cross-Player Data Access**: Backend provides methods to fetch player statistics by Principal ID for any authenticated user including join date and prestige information
- **Personal vs Other Player Views**: Modal displays the same statistical information for both the current user (personal stats) and other players (read-only view)
- **Backend Player Stats Retrieval**: Backend stores and provides access to player statistics including Principal ID, level, prestige level, XP, highest score, Clouds balance, and join date for any authenticated user
- **Real-time Player Stats**: Player statistics are fetched from backend using React Query integration with proper loading and error states
- **Futuristic UI Style**: Consistent with Cloud Jump aesthetic featuring glowing headings, clean card design, soft gradients, and subtle shadows
- **Mobile Responsive**: Player Stats interface is fully responsive and performs smoothly on mobile devices
- **Robust Error Handling**: Player Stats system includes proper error handling for data fetching with user feedback
- **Language**: All content in English

## Clan System
- **Clan Creation**: Logged-in users can create clans with unique names
- **Clan Membership**: Each clan supports up to 50 members maximum
- **Clan Operations**: Users can join existing clans (if under member limit), leave clans, and view clan information
- **Clan Data Tracking**: Each clan stores name, owner (creator), members list, and total combined height (sum of highest heights of all members)
- **Height Synchronization**: When a player's height progress updates, their clan's total height is automatically recalculated
- **Clan Leaderboard**: Global clan leaderboard sorted by total combined height across all clans
- **Global Clan Visibility**: All clan data (membership, leaderboard, clan information) is globally visible and synchronized between all authenticated users
- **Backend Clan Logic**: 
  - Create clan with unique name validation
  - Join existing clan with member limit enforcement
  - Leave clan functionality
  - Get clan information including details, members, and total height
  - Compute and return global clan leaderboard sorted by total height
- **Efficient Updates**: Clan height updates occur only after game sessions end to maintain performance during gameplay
- **Authenticated Users Only**: All clan features are available exclusively to logged-in users with Internet Identity

## Global Statistics System
- **Backend Statistics Storage**: The backend stores four global statistics across all players:
  - Total number of registered players (only unique Internet Identity users count)
  - Total jumps performed across all games
  - Total games played by all users
  - Total height reached by all players combined
- **Global Statistics Aggregation**: Each Internet Identity counts only once for player count, but totals (jumps, games, height) include contributions from all authenticated players across all canister instances
- **Authenticated Players Only**: Only logged-in users with Internet Identity count toward the "Total Players" statistic, with each unique identity counted only once globally
- **Batch Statistics Updates**: All global statistics are updated in batch after each completed game session rather than during gameplay to optimize performance
- **Local Tracking During Gameplay**: Jump counts, height progress, and other statistics are tracked locally during active gameplay
- **End-of-Session Submission**: When a game session ends, all accumulated statistics (jumps made, height achieved, game completion) are sent to the backend in a single batch update
- **Performance Optimization**: No real-time statistics updates during gameplay to prevent lag and maintain smooth performance
- **Statistics Persistence**: All global statistics are persistently stored in the backend and survive canister upgrades
- **Unique Player Registration**: Backend tracks unique Internet Identity principals to ensure each authenticated user is counted only once in total players globally
- **Graceful Fallback for Guests**: Global statistics are fetched and displayed for all users (both authenticated and guest), with appropriate fallback handling when backend queries fail

## Global Chat System
- **Chat Button Placement**: A "Global Chat" button with chat icon is positioned in the top-right corner of the Home screen, next to the Profile and Leaderboard buttons
- **Authentication Required**: The chat button is visible only to logged-in users with Internet Identity
- **Fullscreen Chat Overlay**: When tapped, opens a fully responsive fullscreen overlay with no visible borders or frames that covers the entire viewport with fluid scaling on all devices (mobile and desktop)
- **Chat Interface Design**: 
  - **Fully Opaque Blurred Background**: Solid semi-transparent dark overlay combined with backdrop blur that completely prevents any menu or game elements from showing through while maintaining the clean, futuristic Cloud Jump style
  - Message area displaying recent chat messages from all logged-in users with smooth scrolling
  - Message input container fixed at the bottom of the screen with text input field and send button styled consistently with the game UI
  - Close button (X) in the top-right corner to dismiss the chat and return to the Home screen
- **WhatsApp-Style Message Layout**:
  - User's own messages appear on the **right side** with right alignment
  - Messages from other users appear on the **left side** with left alignment
  - Each message bubble has **auto width** (just large enough for its text content)
  - **Rounded message bubbles** with soft gradients and subtle shadows matching the Cloud Jump aesthetic
  - Consistent spacing between messages for clean visual separation
- **Mobile Keyboard Optimization**: Smooth scrolling and padding adjustments for mobile keyboards, keeping the input area always visible
- **Immersive Design**: Clean, immersive design consistent with Cloud Jump style featuring fully opaque blurred background, soft glow, and clean sans-serif text
- **Global Chat Pool**: Chat messages are visible across all authenticated users using shared storage, ensuring all Internet Identity users see the same global chat pool
- **Backend Chat Storage**: Backend stores up to 50 latest chat messages temporarily with automatic cleanup of older messages
- **Message Data**: Each message includes sender identity, message content, and timestamp
- **Mobile Responsive**: Chat interface is fully responsive and performs smoothly on mobile devices
- **User Identification**: Messages display sender information based on Internet Identity authentication
- **Message History**: Chat displays recent message history when opened, showing the latest messages from all users
- **Robust Error Handling**: Chat system includes proper error handling for failed message sends and fetch operations with user feedback

## Start Screen and Game Flow
- **Redesigned Home Screen** with authentication-aware button display:
  - **Guest Mode**: Shows "Play as Guest" and "Login with Internet Identity" buttons
  - **Authenticated Mode**: Shows "Start Game", "Profile", "Global Chat", "Leaderboard", and "Clan" buttons
- **Top Button Layout**: The Profile, Global Chat, Leaderboard, and Clan buttons are positioned in the top-right corner area, maintaining visual balance and accessibility
- **Cloud Points Display**: A Cloud Points display positioned at the top-left corner of the Home screen showing the user's total Clouds using a vector-based, high-quality gold coin with white stylized cloud icon rendered directly with SVG or Canvas primitives. Visible only to logged-in users, displays their saved Cloud count with dynamic updates. Features minimalist glowing aesthetic, clean typography, and responsive scaling for all devices without interfering with other menu elements
- **Global Statistics Heading**: A stylish, centered heading labeled "Global Statistics" positioned directly above the digital ticker bar, featuring sleek, slightly glowing white or cyan text with subtle shadow and modern clean typography that complements the ticker design
- **Digital Ticker Bar**: Below the Global Statistics heading, displays a sleek horizontal digital ticker bar with soft blur effect, semi-transparent background, smooth glowing edges, and minimalistic futuristic style optimized for mobile game UI
- **Ticker Design Features**: 
  - Subtle motion blur and soft ambient lighting for depth and polish
  - Clean digital typography displaying "Total Players", "Total Jumps", "Total Games Played", and "Total Height Reached" in a compact row
  - Optimized for mobile screens without taking excessive space
  - Smooth integration with backend queries and consistent visual performance
  - Statistics retrieved once per session rather than real-time updates
  - Graceful fallback display when statistics fail to load
- **Compact Layout**: The Global Statistics heading and ticker bar maintain a compact, aligned layout that does not disturb the current balance of the home screen
- **Direct Game Launch**: 
  - **"Play as Guest"** button immediately launches the game without any intermediate menu screens - transitions directly from home screen to active gameplay
  - **"Start Game"** button for authenticated users immediately launches the game without any intermediate menu screens or confirmation dialogs - transitions directly from home screen to active gameplay
- **No Intermediate Screens**: Both guest and authenticated users bypass any "Start Game" confirmation screens or intermediate menus
- **Profile Button**: Visible for both guest and logged-in users
  - For guests: Display profile information without guest mode indicators in header
  - For logged-in users: Display XP, current level, prestige level (if applicable), and progress with real-time updates
- **Leaderboard Button**: Visible only for logged-in users, positioned next to Profile, Global Chat, and Clan buttons
- **Clan Button**: Visible only for logged-in users, positioned next to Profile, Global Chat, and Leaderboard buttons
- **Fully responsive** with visual consistency to the current Cloud Jump style
- **3D-like button design** consistent with existing style
- **No "How to Play" section**: The home screen does not include any "How to Play" information card or section for either guest mode or logged-in versions

## Header Area
- **No Guest Mode Indicators**: The header area on all pages (Home, Game, Profile) must not display any "Guest Mode" labels, banners, or text
- **Clean Header Design**: Header contains only essential navigation elements like buttons or icons
- **Consistent Navigation**: All other header elements remain intact and functional across all pages

## Profile Modal
- **Guest Mode Display**: Shows guest status with message "Log in with Internet Identity to save your progress and level up!"
- **Login Button in Profile**: When user is not authenticated, display a "Login with Internet Identity" button below the message in the same visual design style as main menu buttons
- **Login Flow Integration**: Button triggers the existing Internet Identity login flow used on the Home screen
- **Authenticated User Display**: Shows current XP, level, prestige level (if applicable), progress, total Clouds earned, progress toward next Cloud, and join date formatted as "Joined dd.mm.yyyy" with real-time synchronization from backend based on height achievements
- **Prestige Display**: For users who have reached Level 100, displays current prestige level in premium style consistent with the futuristic Cloud Jump interface
- **Cloud Progress Display**: Shows "X height until next Cloud" indicating how many height points remain until earning the next Cloud
- **Vector Cloud Icon**: Uses the same vector-based, high-quality gold coin with white stylized cloud icon rendered directly with SVG or Canvas primitives for visual consistency with the home screen display
- **Join Date Display**: For authenticated users, displays the join date in "dd.mm.yyyy" format using the user's locale, positioned below other profile information
- **Progress Updates**: Profile data updates immediately after each game session for logged-in users based on height-derived XP, prestige calculations, and Cloud calculations
- **Mobile Responsive**: UI remains mobile-responsive and aesthetically consistent with the rest of the app
- **Visual Consistency**: Modern, 3D-style buttons matching the app's design language
- **Language**: All content in English
- **Robust Data Loading**: Profile modal includes proper loading states and error handling for user data fetching

## Leaderboard Modal
- **Leaderboard Button Access**: Leaderboard modal is accessible via the "Leaderboard" button visible only to logged-in users on the Home screen
- **Fullscreen Leaderboard Interface**: Opens a fully responsive fullscreen overlay with no visible borders that covers the entire viewport with fluid scaling on all devices (mobile and desktop)
- **Leaderboard Modal Design**:
  - **Fully Opaque Blurred Background**: Solid semi-transparent dark overlay combined with backdrop blur that completely prevents any menu or game elements from showing through while maintaining the clean, futuristic Cloud Jump style
  - **Scrollable Player List**: Displays all Internet Identity users ranked by highest score in descending order
  - **Player Entry Display**: Each entry shows Principal ID, highest score, current level, and prestige level (if applicable) in a clean, card-based layout with consistent spacing
  - Close button (X) in the top-right corner to dismiss the modal and return to the Home screen
- **Ranking System**: Players are sorted by their highest score achieved across all game sessions in descending order
- **Cross-Identity Data Access**: Leaderboard fetches data for all Internet Identity users across all canister instances, not limited to the current user's canister
- **Real-time Data**: Leaderboard data is fetched from backend with React Query integration
- **Futuristic UI Style**: Consistent with Cloud Jump aesthetic featuring glowing headings, clean card design, soft gradients, and subtle shadows
- **Mobile Responsive**: Leaderboard interface is fully responsive and performs smoothly on mobile devices
- **Robust Error Handling**: Leaderboard system includes proper error handling for data fetching with user feedback
- **Language**: All content in English

## Clan Modal
- **Clan Button Access**: Clan modal is accessible via the "Clan" button visible only to logged-in users on the Home screen
- **Fullscreen Clan Interface**: Opens a fully responsive fullscreen overlay with no visible borders that covers the entire viewport with fluid scaling on all devices (mobile and desktop)
- **Clan Modal Design**:
  - **Fully Opaque Blurred Background**: Solid semi-transparent dark overlay combined with backdrop blur that completely prevents any menu or game elements from showing through while maintaining the clean, futuristic Cloud Jump style
  - **Tabbed Navigation**: Four main tabs - "My Clan", "Join Clan", "Create Clan", and "Leaderboard"
  - Close button (X) in the top-right corner to dismiss the modal and return to the Home screen
- **My Clan Tab**: 
  - Displays current clan information including clan name, member count, total combined height
  - Shows list of clan members
  - "Leave Clan" button if user is in a clan
  - Message "You are not in a clan" if user has no clan membership
- **Join Clan Tab**:
  - Search or browse available clans
  - Display clan names, member counts, and total heights
  - "Join" button for each clan (disabled if clan is full at 50 members)
- **Create Clan Tab**:
  - Text input field for unique clan name
  - "Create Clan" button
  - Validation for unique clan names
- **Leaderboard Tab**:
  - Global clan leaderboard sorted by total combined height
  - Display clan names and their total height values
  - Scrollable list of all clans
- **Futuristic UI Style**: Consistent with Cloud Jump aesthetic featuring glowing headings, clean card design, soft gradients, and subtle shadows
- **Mobile Responsive**: Clan interface is fully responsive and performs smoothly on mobile devices
- **Robust Error Handling**: Clan system includes proper error handling for all clan operations with user feedback
- **Language**: All content in English

## Backend Data Storage
- **Shared Global Data**: All authenticated Internet Identity users share global data for chat, clans, leaderboard, and statistics rather than isolated canister instances
- **Cross-Identity Access**: Backend update permissions are configured for cross-identity access to enable proper data sharing
- **User Profile Data**: XP derived from height achievements, current level, prestige level, highest score, total Clouds earned, join date timestamp, and game progress per account with reliable persistence
- **Prestige Data Storage**: Backend stores prestige level for each authenticated user with automatic calculation based on XP thresholds and reliable synchronization
- **Join Date Tracking**: Backend stores a `joinedAt` timestamp (Int) for each user profile, populated when a user first creates or saves their profile
- **Profile Initialization**: Backend logic in `saveCallerUserProfile` and `initializeAccessControl` records the current timestamp for first-time users
- **Cloud Currency Storage**: Backend stores total Clouds earned for each authenticated user based on cumulative height achievements
- **High Score Tracking**: Backend stores and updates each player's highest score achieved across all game sessions for leaderboard functionality
- **Global Leaderboard Data**: Backend provides methods to retrieve all Internet Identity users sorted by highest score with Principal IDs, highest scores, levels, and prestige levels for global leaderboard display across all canister instances
- **Player Statistics by Principal ID**: Backend provides methods to fetch detailed player statistics (Principal ID, level, prestige level, XP, highest score, Clouds balance, join date) for any authenticated user by their Principal ID
- **Cross-Player Statistics Access**: Backend allows authenticated users to query statistics for other players by Principal ID for the Player Stats Modal functionality
- **Clan Data**: Clan information including name, owner, members list, and total combined height with automatic height recalculation
- **Clan Operations**: Backend methods for creating clans, joining clans, leaving clans, and retrieving clan information
- **Clan Leaderboard**: Backend computation and retrieval of global clan leaderboard sorted by total combined height
- **Global Statistics**: Total players (unique Internet Identity users only), total jumps, total games played, and total height reached across all users
- **Chat Message Storage**: Backend stores up to 50 latest chat messages with automatic cleanup, including sender identity, message content, and timestamp
- **Batch Statistics Processing**: Backend processes statistics updates in batches at the end of each game session
- **Unique Player Tracking**: Backend maintains a record of unique Internet Identity principals to ensure each authenticated user is counted only once
- **Statistics Retrieval**: Backend provides methods to fetch current global statistics for display with proper error handling
- **Chat Message Retrieval**: Backend provides methods to fetch recent chat messages for display in the chat interface with proper error handling
- **Message Persistence**: Chat messages are stored temporarily with automatic cleanup when exceeding 50 messages
- **Persistent Storage**: Data remains between game sessions with consistent synchronization
- **Authenticated Users Only**: Guest mode uses no backend storage for personal data and does not contribute to player count statistics, chat functionality, clan features, or leaderboard rankings
- **Level Calculation Logic**: Backend implements the specific XP-to-level progression system using height-based XP
- **Prestige Calculation Logic**: Backend implements prestige progression system with automatic prestige level calculation based on XP thresholds
- **Cloud Calculation Logic**: Backend implements Cloud earning logic based on cumulative height achievements (1 Cloud per 2500 height points)
- **Session-End Updates**: Backend immediately processes and stores XP gains, prestige progression, Cloud earnings, high scores, statistics, and clan height updates from completed game sessions
- **Data Consistency**: Frontend and backend maintain synchronized progress data at all times
- **Robust Error Handling**: Backend includes comprehensive error handling for all data operations with appropriate error responses
- **Reliable Backend Communication**: Backend endpoints for `getGlobalStatistics`, `getCallerUserProfile`, and `getRecentChatMessages` respond properly and handle authentication checks consistently for logged-in users
- **Canister Initialization**: Backend ensures proper canister initialization before handling any data requests
- **Authentication Verification**: Backend consistently verifies Internet Identity authentication for all user-specific operations
- **Cross-Canister Data Sharing**: Backend is configured to share global data (chat, clans, leaderboard, statistics) across all canister instances for all Internet Identity users
- **Shared Backend Actor Initialization**: Backend actors are properly initialized and accessible to all Internet Identity users without user-specific isolation
- **Global Data Access**: All global statistics, chat messages, and profile data use shared canister storage instead of user-isolated sessions
- **Connection Reliability**: Backend connection issues are resolved to ensure consistent data loading for all authenticated users
- **Actor Accessibility**: Backend actors remain accessible across all user sessions and do not require per-user initialization

## Game Mechanics
- Character jumps automatically upward
- Left/Right movement through user input (keyboard, touch, or device tilt)
- Screen wrap-around: Character appears on the other side when leaving the screen
- On missed jump, character falls down and game ends only when player falls below the bottom screen edge
- **Height Tracking**: Continuous tracking of player's vertical position and maximum height achieved during each session
- **Local Jump Counting**: Each jump is counted locally during gameplay and submitted to backend at session end
- **Local Statistics Tracking**: All gameplay statistics are tracked locally during play and batch-submitted when the game session ends
- **Cloud Currency Display**: Vector-based, high-quality gold coin with white stylized cloud icon rendered directly with SVG or Canvas primitives displayed in top-left corner of game UI showing current Cloud count (visible only to logged-in users)
- **Cloud Animation**: Subtle glow and smooth animation effects when Clouds are earned, consistent with futuristic Cloud Jump aesthetic
- **Prestige Display in Game UI**: For users in prestige mode, displays current prestige level in game UI in premium style consistent with the futuristic Cloud Jump interface

## Audio System
- **Jump Sound Effect**: Satisfying bounce/jump audio clip plays every time the player jumps
- **Jetpack Sound Effect**: Distinctive jetpack activation sound plays when the jetpack power-up is collected, featuring a satisfying whoosh or rocket ignition audio cue
- **Rocket Sound Effect**: Powerful rocket launch sound plays when the rocket power-up is collected, featuring an intense rocket engine ignition audio cue
- **Game Over Sound Effect**: Suitable falling/game-over sound effect plays once when the player falls off the screen and triggers game over, integrated into the game's audio system and triggered at the moment of fall detection in the `useGameLogic.ts` hook
- **Sound Integration**: Audio playback integrated directly within the jump logic, power-up collection logic, and game over detection logic in `useGameLogic.ts` to trigger exactly when actions occur
- **Audio Source**: Uses internally stored or generated short audio clips that feel responsive but not repetitive
- **Volume Balance**: Volume level balanced for both mobile and desktop devices
- **Playback Control**: Multiple sounds do not overlap through controlled playback to prevent stacking
- **Performance Optimization**: Sound integration maintains smooth gameplay and unaffected frame rate
- **Mobile Playback Performance**: Optimized audio playback performance for mobile devices with no audio overlap or looping

## Endless Level Logic
- **Fixed Player Position**: Player remains vertically mostly at a fixed position on screen
- **World Scrolling**: The world (platforms, enemies, power-ups) scrolls downward once player reaches a certain height value
- **Continuous Generation**: New platforms are continuously generated 2-3 screen heights above the player
- **Optimized Cleanup**: Platforms are immediately removed once they leave the bottom visible screen edge to prevent lag
- **Performance Optimization**: Only active, visible platforms and objects remain in memory and are updated or rendered
- **Height Measurement**: Accurate tracking of cumulative height progress as the world scrolls

## Procedural Generation
- **Variable Spacing**: Minimum and maximum distance between platforms varies based on height/score reached
- **Difficulty Scaling**: Different platform types with increasing difficulty based on height
- **Random Bonuses**: Enemies and power-ups are randomly generated, correlating with height reached
- **Parametric Control**: All generation parameters are height-dependent configurable

## Performance Management
- **Efficient Platform Management**: The `useGameLogic.ts` hook filters platform arrays per frame to keep only visible platforms
- **Immediate Removal**: Platforms below the visible area are immediately removed from the active list
- **Lightweight Garbage Collection**: The `gameRenderer.ts` system automatically removes off-screen entities for stable framerate
- **Constant Performance**: Game performance remains constant regardless of play duration through efficient memory management
- **Optimized Statistics**: No real-time statistics updates during gameplay to maintain smooth performance

## Game Start and Positioning
- Player is always positioned in the center of the screen at level start
- Automatic creation of a stable starting platform directly below the player's starting position (20-30 pixels below)
- Starting platform is integrated into regular platform management and can be deleted or recycled later
- Collision detection prevents the player from falling at start before the first jump movement is possible
- **Height Initialization**: Height tracking starts from zero at the beginning of each game session

## Physics System
- Gravity pulls the character downward
- Impact detection between character and platforms
- Jump force on contact with platforms
- Realistic movement physics
- Adjusted gravity constants and jump speed for the new scaling system

## Platform Types
- **Normal Cloud Platforms**: Impressive cloud-shaped platforms with smooth, slightly fluffy appearance, subtle shading, and soft edges drawn natively in Canvas. Maintain existing physics and collision behavior
- **Breaking Cloud Platforms**: Cloud platforms that disappear after contact, maintaining cloud visual style
- **Spring Cloud Platforms**: Cloud platforms that give extra jump force (booster), maintaining cloud visual style
- **Propeller Cloud Platforms**: Cloud platforms that enable brief upward flight, maintaining cloud visual style
- **Moving Cloud Platforms**: Cloud platforms that move horizontally with smooth left-to-right and right-to-left oscillation using time-based sinusoidal animation. Only 15-20% of all platforms are moving clouds to maintain gameplay balance. Movement uses configurable speed and range parameters with consistent collision detection and bouncing physics
- **Fixed Cloud Size**: All cloud platforms have a consistent and fixed size throughout the game with no random size variation or scale jitter
- **Static Cloud Positioning**: Non-moving cloud platforms remain perfectly still relative to the scrolling world with no shaking or jitter effects during player movement or jumping
- **Smooth Moving Platform Animation**: Moving cloud platforms use time-based sinusoidal movement to avoid jittering, with smooth horizontal oscillation that maintains visual quality and collision accuracy
- **Visual Quality**: Cloud rendering maintains visual and collision quality while being performance optimized
- **Consistent Generation**: Cloud generation and recycling logic maintains infinite level flow with proper distribution of moving vs static platforms

## Power-Up System
- **Jetpack Power-Up**: A power-up item that propels the character significantly faster and higher than the propeller hat
- **Jetpack Visuals**: Sleek animated jetpack rendered with vector-based graphics featuring flame effects using gradients and motion blur for a futuristic appearance
- **Jetpack Physics**: Temporarily boosts vertical speed and height when collected, with smooth transition back to normal gravity after duration expires
- **Extended Jetpack Duration**: Jetpack provides approximately 5 seconds of sustained flight for extended gameplay excitement
- **Jetpack Spawn Logic**: Integrated into random power-up generation system alongside existing power-ups with appropriate spawn frequency
- **Jetpack Animation**: Smooth flame effects and jetpack animation that runs synchronously with game update rate for the full 5-second duration
- **Jetpack Sound**: Distinctive jetpack activation sound effect for satisfying audio feedback when collected, synchronized with the extended flight duration
- **Jetpack Immunity**: While the jetpack is active, the player becomes immune to enemy collisions and damage
- **Enemy Destruction**: Enemies are destroyed upon contact with the player while jetpack mode is active
- **Immunity Duration**: Jetpack immunity and enemy destruction are active only during the 5-second jetpack flight duration and return to normal behavior afterward
- **Mobile Compatibility**: Jetpack power-up works seamlessly on mobile devices and maintains performance optimization during the extended flight period
- **No Overlap**: Jetpack power-up does not conflict with propeller hat functionality and has distinct behavior and appearance
- **Futuristic Style**: Jetpack design aligns with Cloud Jump's high-quality, futuristic aesthetic using vector-based rendering
- **Balanced Power**: Extended duration maintains visual excitement while remaining balanced for gameplay progression
- **Right-Side Jetpack Positioning**: The Jetpack is positioned on the character's back but shifted slightly to the right side to be more visible while maintaining attachment to the back. The jetpack appears on the right side of the character while still being positioned behind them for natural appearance during both idle and jump animations
- **Flame Alignment**: Flame effects are properly aligned with the shifted jetpack position without breaking the animation or hitbox. The flame animation origin and rotation pivot are adjusted to match the right-side positioning
- **Balanced Visual Aesthetics**: The right-side positioning maintains balanced visual aesthetics and consistent perspective across all movement and idle animations
- **No Character Clipping**: Jetpack positioning ensures no clipping into the character model while maintaining smooth integration with all player animations
- **Physics Unchanged**: All physics and item interactions remain unchanged - this is strictly a visual adjustment to the jetpack positioning
- **Rocket Power-Up**: A power-up item that appears randomly throughout the game and launches the player much faster and higher than the jetpack
- **Rocket Visuals**: High-quality, vector-based cartoon-style space rocket with transparent front window showing the character's head inside, rendered with smooth flight animation and flame effects
- **Rocket Physics**: Provides significantly more vertical boost than the jetpack and lasts for 10 seconds of sustained flight
- **Rocket Duration**: Extended 10-second flight duration for maximum gameplay excitement
- **Rocket Spawn Logic**: Integrated into power-up generation system with random spawning throughout the game at any height
- **Rocket Animation**: Smooth rocket animation with flame effects and dynamic scaling optimized for mobile devices
- **Rocket Sound**: Powerful rocket launch sound effect synchronized with the 10-second flight duration
- **Rocket Invulnerability**: Complete invulnerability during the 10-second rocket flight with instant enemy destruction on contact
- **Character Visibility**: Character's head remains visible through the transparent rocket window during flight
- **Rocket Rendering**: Correct layer order ensures character visibility through window while maintaining rocket appearance
- **Mobile Optimization**: Rocket power-up maintains performance optimization and smooth operation on mobile devices
- **Art Style Consistency**: Rocket design matches Cloud Jump's futuristic aesthetic with high-quality vector-based rendering
- **Balanced Spawn Frequency**: Rocket spawn frequency remains balanced alongside other power-ups (jetpacks, propeller hats) without performance impact
- **Item Collection Blocking**: While any power-up effect is active (Jetpack, Propeller Hat, Rocket, etc.), all other power-up and item collection is temporarily disabled until the current item's duration ends
- **Collision Immunity During Active Effects**: When an item effect is active, overlapping item collision checks are ignored or disabled to prevent multiple simultaneous power-up effects
- **Collection Re-enablement**: Once the active item's effect duration finishes, item collection returns to normal functionality allowing new power-ups to be collected

## Enemies and Interaction
- Random generation of enemies in the level
- Shooting function for enemies
- **Enemy Stomp Mechanics**: When the player lands on an enemy from above (with downward velocity), the enemy is immediately destroyed and the player receives a small bounce effect for smooth gameplay
- **Directional Collision Detection**: Clear collision detection system that determines if contact is from above (player falling onto enemy) or from below/side (enemy collision with player)
- **Velocity-Based Detection**: Collision system checks the player's downward velocity and relative position to the enemy to determine if the contact is from above
- **Side/Below Collision**: Colliding with an enemy from below or the side still results in the player's death as before
- **Enemy Destruction Animation**: Consistent animations and sound effects upon enemy destruction when stomped from above
- **Jetpack Immunity Integration**: Enemy stomp mechanics work seamlessly with existing immunity conditions during Jetpack power-up (enemies destroyed on any contact during jetpack flight)
- **Rocket Invulnerability Integration**: Enemy stomp mechanics work seamlessly with existing invulnerability conditions during Rocket power-up (enemies destroyed on any contact during rocket flight)
- **Normal Enemy Behavior**: When no power-up is active, enemies maintain standard collision behavior that ends the game except when stomped from above
- **Improved Enemy Design**: Clear outlines, vibrant colors, and original, stylistically appropriate appearance matching the Doodle Jump style
- **Enemy Animation**: Smooth, slightly random wobble or swing animation (sine-based, subtly translational or rotational wobble with low amplitude)
- Animations run synchronously with game update rate
- Enemy hitboxes and movement patterns remain unchanged
- Performance-optimized for smooth display on mobile devices

## Scoring System
- Points awarded based on height reached
- Display current score in top left of screen
- Bonus points for eliminating enemies
- **Bonus Points for Jetpack Enemy Destruction**: Additional points awarded when enemies are destroyed during jetpack flight
- **Bonus Points for Rocket Enemy Destruction**: Additional points awarded when enemies are destroyed during rocket flight
- **Bonus Points for Enemy Stomping**: Additional points awarded when enemies are destroyed by landing on them from above
- Score progress remains synchronized with the endless level system
- **Height-Based XP Display**: Real-time display of current height and corresponding XP during gameplay
- **Level Progression Display**: Shows current level and XP progress based on height achievements
- **Prestige Display**: For users in prestige mode, displays current prestige level in game UI in premium style
- **Cloud Currency Display**: Vector-based, high-quality gold coin with white stylized cloud icon rendered directly with SVG or Canvas primitives in top-left corner showing current Cloud count with futuristic styling and subtle glow (visible only to logged-in users)
- **Progress Synchronization**: Height-derived XP updates are immediately synchronized between frontend and backend for authenticated users
- **High Score Tracking**: Current session score is compared against personal best and updated in backend when a new high score is achieved

## Game Over Logic
- **Game End Detection**: Game ends exclusively when player's vertical position falls below the bottom screen edge
- **Jetpack Immunity Exception**: During jetpack flight, enemy collisions do not trigger game over
- **Rocket Invulnerability Exception**: During rocket flight, enemy collisions do not trigger game over
- **Enemy Stomp Exception**: Landing on enemies from above destroys the enemy and does not trigger game over
- **Game Over Overlay**: Display game-over screen with current score, maximum height achieved, and "Restart" button
- **Game Logic Stop**: After game over, no new platforms or enemies are spawned
- **Movement Stop**: Player character doesn't fall further after game over
- **Restart Function**: Ability to start the game via "Restart" button
- **Game Over Sound Effect**: Suitable falling/game-over sound effect plays once at the moment of fall detection, integrated into the game over logic in `useGameLogic.ts`
- **Batch Statistics Submission**: Game over triggers batch submission of all accumulated statistics (jumps, height, game completion) to backend for both authenticated and guest users
- **Height-Based XP Award**: For logged-in users, XP equal to the maximum height achieved in the session is awarded and level progress is updated
- **Prestige Progression**: For logged-in users, prestige level is calculated and updated based on accumulated XP
- **Cloud Currency Award**: For logged-in users, Clouds are calculated and awarded based on cumulative height achievements (1 Cloud per 2500 height points)
- **High Score Update**: For logged-in users, current session score is compared against personal best and updated in backend if a new high score is achieved
- **Backend Synchronization**: Game over triggers immediate synchronization of height-based XP, prestige progression, Cloud earnings, progress data, and high scores to backend for authenticated users
- **Clan Height Updates**: Game over triggers clan total height recalculation for authenticated users who are clan members
- **Performance Optimized Updates**: All statistics updates occur after gameplay ends to maintain smooth performance during play

## Scaling System
- Reduced visible world height for authentic platform and player sizes corresponding to the original
- Adjusted camera zoom/viewport factor for smaller visible area in fullscreen display
- Increased visual platform density through the new scaling system
- Dynamic adjustment of aspect ratio and rendering resolution to screen width/height
- Consistent proportions on all devices
- Visual scrolling remains aligned with the endless level system

## Character Display
- Use of the provided PNG image `AECB502E-B024-4E55-9562-6EB302661805-1.png` as player character
- Transparent background is respected, no background pixels are rendered
- Visual scaling factor of 1.35x for slightly enlarged character display
- Scaling and positioning according to original Doodle Jump logic
- Character anchored at feet for correct platform collision
- Physics bounding box remains unchanged for accurate collision detection and movement
- All animations (jumping, leaning, falling) remain identical to original game mechanics
- Proportional adjustment to platforms and screen layout on all devices
- Correct centering on screen with responsive rendering

## Visual Design
- **Cartoon-Style Cloud Paradise Background**: The Canvas renderer in `frontend/src/lib/gameRenderer.ts` features a layered, hand-drawn cloud-sky theme with bright blue gradients, soft white clouds, and subtle shading
- **Parallax Scrolling Effect**: Smooth parallax scrolling effect on distant background clouds for depth perception
- **Background Integration**: New background integrates seamlessly with fullscreen view, remains responsive, and maintains smooth performance on mobile and desktop
- **Rendering Order**: Preserves current gameplay rendering order (background → platforms → player → enemies → power-ups)
- **Cloud Platforms**: All jump platforms are rendered as impressive cloud shapes with smooth, slightly fluffy appearance, subtle shading, and soft edges using Canvas primitives
- **Fixed Cloud Appearance**: Non-moving cloud platforms maintain consistent fixed size and stable positioning without any visual jitter or movement effects
- **Moving Cloud Platform Rendering**: Moving cloud platforms are rendered smoothly in sync with their horizontal position within the existing parallax environment, maintaining visual consistency with static platforms
- **Cloud Styling**: Cloud platforms maintain colored appearance with black outlines and simple shading for 3D effect
- **Minimalist Design**: Overall design remains minimalist while featuring impressive cloud platforms and cartoon-style cloud paradise background
- **Enemies**: Enemies with improved visual design in Doodle Jump style
- **Jetpack Power-Up Rendering**: Jetpack power-up rendered with vector-based graphics featuring sleek design, animated flame effects using gradients and motion blur, aligned with Cloud Jump's futuristic aesthetic
- **Rocket Power-Up Rendering**: Rocket power-up rendered with high-quality vector-based graphics featuring cartoon-style space rocket design with transparent front window, smooth flight animation, flame effects, and dynamic scaling optimized for mobile devices

## User Interface
- **Start Screen**: High-quality visual layout in Doodle Jump style with dynamic parallax background
- **Cloud Points Display**: Positioned at the top-left corner of the Home screen, showing the user's total Clouds using a vector-based, high-quality gold coin with white stylized cloud icon rendered directly with SVG or Canvas primitives. Visible only to logged-in users, displays their saved Cloud count with dynamic updates. Features minimalist glowing aesthetic, clean typography, and responsive scaling for all devices without interfering with other menu elements
- **Global Statistics Heading**: Stylish, centered heading labeled "Global Statistics" positioned directly above the digital ticker bar with sleek, slightly glowing white or cyan text, subtle shadow, and modern clean typography that complements the ticker design
- **Digital Ticker Bar**: Sleek horizontal digital ticker bar displaying global statistics with futuristic design elements:
  - Soft blur effect and semi-transparent background
  - Smooth glowing edges with subtle motion blur
  - Soft ambient lighting for depth and polish
  - Clean digital typography for "Total Players", "Total Jumps", "Total Games Played", and "Total Height Reached"
  - Compact row layout below the Global Statistics heading optimized for mobile screens
  - Minimalistic futuristic style without taking excessive space
  - Statistics retrieved once per session for optimal performance
  - Graceful fallback display when statistics fail to load
- **Compact Layout Alignment**: The Global Statistics heading and ticker bar maintain compact, aligned positioning that does not disturb the current balance of the home screen
- **Game Title**: "Cloud Jump" displayed with thin, clean black outline and golden gradient preserved
- **3D Buttons**: Buttons with gradients, light effects, and smooth hover animations
- **Smooth Motion Effects**: Subtle animations for premium feel
- **Fully Responsive**: Mobile-friendly design with smooth transitions into gameplay
- **Level-up Feedback**: Progress bar, level display, and XP indicators reflect height-based XP with real-time updates
- **Progress Display**: Shows current XP derived from height, XP needed for next level, current level, and prestige level (if applicable) with consistent synchronization
- **Prestige UI Elements**: Premium-styled prestige level display in Profile, Leaderboard, and Game UI consistent with futuristic Cloud Jump interface
- **Cloud Currency UI**: Vector-based, high-quality gold coin with white stylized cloud icon rendered directly with SVG or Canvas primitives displayed in top-left corner of game UI with futuristic styling, subtle glow, and smooth animations (visible only to logged-in users)
- "Pause" function during gameplay
- "New Game" option after game over
- All texts and menus in English
- No branding or attribution elements in UI

## Controls
- **Desktop**: Keyboard (arrow keys or WASD) for left/right movement
- **Mobile Touch**: Tap on left/right screen half
- **Mobile Tilt**: Movement control through device tilt (DeviceOrientation API)
  - Tilt left = Character moves left
  - Tilt right = Character moves right
  - Smooth, analog movement progression
  - Sensitivity curve filters out small angle changes
  - Natural inertia like in the original
  - Only activated on mobile devices (User-Agent detection)
- Spacebar or tap to shoot

## Game States
- Start menu with high-quality visual design, authentication options, Cloud Points display in top-left corner (visible only to logged-in users), Global Statistics heading, digital ticker bar displaying global statistics, Global Chat button, Leaderboard button, and Clan button for authenticated users
- Active game with height tracking, local statistics tracking, Cloud currency display (visible only to logged-in users), prestige level display (if applicable), moving platform animations, extended jetpack power-up functionality with 5-second duration, rocket power-up functionality with 10-second duration and random spawning at any height, jetpack immunity and enemy destruction mechanics, rocket invulnerability and enemy destruction mechanics, enemy stomp mechanics with directional collision detection, item collection blocking during active power-up effects, right-side jetpack positioning for enhanced visibility while maintaining back attachment, and optimized performance
- Pause
- Game over with score display, maximum height achieved, restart option, game over sound effect, and batch statistics submission (only triggered when player falls below bottom screen edge)
- Profile view with level, prestige level (if applicable), XP display, Cloud count, progress toward next Cloud, and join date formatted as "Joined dd.mm.yyyy" using height-based progression system with real-time synchronization and vector cloud icon
- Global Chat overlay with full-screen interface for authenticated users
- Leaderboard modal with scrollable player rankings showing Principal ID, highest score, level, and prestige level (if applicable) for authenticated users
- Clan modal with tabbed interface for clan management and leaderboards for authenticated users
- Player Stats modal with detailed player statistics including prestige level and join date accessible from Chat, Clan, and Leaderboard interfaces for authenticated users

## Frontend-Backend Synchronization
- **useQueries Integration**: React queries handle data fetching and caching for user progress based on height achievements, prestige progression, Cloud currency data, global statistics with optimized performance for the digital ticker bar, chat messages, clan data, leaderboard data, and player statistics by Principal ID including join date and prestige information
- **Robust Query Management**: All React Query hooks include proper loading states, error handling, retry logic, and cache invalidation strategies
- **Authentication-Aware Queries**: Queries are conditionally executed based on authentication status to prevent unnecessary requests for guest users
- **Graceful Fallback Handling**: Guest users receive appropriate fallback data and UI states without triggering user-specific backend calls
- **Connection Recovery**: Query system handles network reconnection and data restoration after refresh or connection loss
- **Race Condition Prevention**: Query dependencies and proper loading states prevent race conditions and uninitialized query states
- **Optimized Caching**: Query caching strategies prevent redundant requests while ensuring data freshness
- **Batch Updates**: Game logic components trigger backend updates only at the end of game sessions when height-based XP is earned, prestige progression is calculated, Clouds are calculated, and statistics are accumulated
- **ProfileModal Synchronization**: Profile modal displays real-time progress data including prestige level, Cloud count, progress toward next Cloud, and join date synchronized with backend using height-derived calculations with proper loading and error states
- **Session-Based Statistics**: Home page fetches global statistics from backend once per session for the digital ticker bar with fallback handling
- **Chat Message Synchronization**: Chat interface fetches recent messages from backend and sends new messages with standard query/update behavior and proper error handling
- **Leaderboard Data Synchronization**: Leaderboard modal fetches player rankings including prestige levels from backend across all canister instances with React Query integration and proper loading and error states
- **Clan Data Synchronization**: Clan modal fetches clan information, member lists, and leaderboards from backend with proper loading and error states
- **Player Stats Data Synchronization**: Player Stats modal fetches detailed player statistics including prestige level and join date by Principal ID from backend with React Query integration and proper loading and error states
- **Efficient Clan Updates**: Clan height updates occur only after game sessions end to maintain performance during gameplay
- **Consistent State Management**: Frontend and backend maintain identical progress calculations and data consistency for height-based XP, prestige progression, Cloud currency, global statistics, chat messages, clan data, leaderboard rankings, and player statistics including join date and prestige level
- **Error Handling**: Robust error handling ensures progress, statistics, prestige progression, Cloud currency, chat messages, clan data, leaderboard data, and player statistics are not lost during synchronization failures with user feedback
- **Performance Optimized Updates**: All progress changes and statistics updates occur after gameplay sessions end to maintain smooth performance during play
- **Canister Initialization Dependency**: All React Query hooks wait for proper canister initialization before executing to prevent failed requests
- **Authentication State Dependency**: Queries that require authentication wait for Internet Identity authentication to complete before executing
- **Query Revalidation Optimization**: Queries are configured to revalidate only when necessary to avoid redundant calls that could block loading
- **Consistent Backend Instance**: All user identities share the same global backend instance ensuring chat, clan, and statistic data load reliably for all Internet Identity users
- **Proper Error Boundaries**: Frontend includes error boundaries and fallback UI states for failed backend communication
- **Loading State Management**: All data-dependent UI components properly handle loading states to prevent empty screens during data fetching
- **Enhanced Error Handling in useQueries**: Robust error handling and fallback logic in `useQueries.ts` prevents data fetching failures from causing blank UI components
- **Connection Issue Resolution**: Backend connection issues are resolved to ensure global statistics, profile data, and chat messages load properly for all authenticated users
- **Shared Actor Access**: Backend actors are correctly initialized and accessible to all Internet Identity users without user-specific isolation
- **Global Data Verification**: Global stats, chat, and profile queries use shared canister data instead of user-isolated sessions to ensure proper data sharing across all users

## Fullscreen and Mobile Optimization
- Fullscreen display on all devices (mobile and desktop)
- Disable pinch-to-zoom and double-tap-zoom on mobile browsers
- Prevent browser zoom or layout scaling
- Mobile responsiveness: Game canvas automatically adapts to full device screen width and height
- Disable text selection and drag functions for all elements
- Global CSS rules: user-select: none, touch-action: none
- Viewport meta tags: user-scalable=no for native app experience
- Scaling changes do not affect mobile responsiveness and fullscreen behavior

## Metadata and Branding
- **Document Title**: "Cloud Jump" in page title tags and metadata
- **Application Name**: All references to the application name use "Cloud Jump"
- **Header Text**: Any header or logo text components display "Cloud Jump"
- **In-Game References**: All HUD elements and menu references use "Cloud Jump"
