# GCC Medical Practice Launch Course Platform - PRD

## Original Problem Statement
Build a comprehensive 12-week course platform for "Launch Your Medical Practice in the Middle East" that transforms healthcare entrepreneurs into Gulf region practice owners. The platform includes course content management, interactive tools (financial calculators, GCC market selection matrix), student progress tracking, AI chatbot support, and admin panel.

## User Personas
1. **Primary Student**: U.S.-licensed healthcare professionals (physicians, nurses, allied health) seeking to establish medical practices in GCC countries
2. **Military Veterans**: Navy Corpsmen, Army medics with medical backgrounds looking for international opportunities
3. **Healthcare Entrepreneurs**: Practice owners seeking tax-optimized international expansion
4. **Course Administrator**: Content managers who create and update course modules

## Core Requirements (Static)
- 12-week comprehensive curriculum with video modules
- Interactive financial tools (Market Matrix, Financial Calculator)
- Student progress tracking and dashboard
- AI chatbot support (Claude Sonnet 4.5)
- Admin content management panel
- Both JWT and Google OAuth authentication
- Healthcare-focused professional design
- ElevenLabs text-to-speech audio narration

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 via emergentintegrations
- **TTS**: ElevenLabs API
- **Auth**: JWT + Emergent Google OAuth

## What's Been Implemented (January 2025)

### Phase 1 - MVP Complete ✅
- [x] Landing page with hero section, stats, benefits, curriculum preview
- [x] Login/Register with both email/password and Google OAuth
- [x] Student dashboard with progress tracking and quick actions
- [x] Course curriculum page (12 weeks with module list)
- [x] Module detail page with video player and content
- [x] Interactive Tools page
- [x] GCC Market Selection Matrix (15+ criteria scoring calculator)
- [x] Financial Calculator (startup costs, expenses, 3-year projections with charts)
- [x] AI Chatbot powered by Claude Sonnet 4.5
- [x] Admin dashboard with platform stats
- [x] Admin content management (CRUD for modules)
- [x] Settings page with profile and notifications
- [x] Week 1 content fully pre-loaded
- [x] Weeks 2-12 structure with placeholders

### Phase 2 - ElevenLabs TTS Integration ✅ (January 2025)
- [x] ElevenLabs API integration
- [x] Multiple voice options (Dr. Marcus, Dr. Amara, Coach Jordan)
- [x] Full audio player with controls (play, pause, skip, speed, volume)
- [x] Audio player on module content pages
- [x] Audio button on chatbot responses
- [x] User voice preference storage
- [x] Audio caching for performance

### Database Collections
- `users` - User accounts with roles (student, instructor, admin)
- `user_sessions` - OAuth session management
- `modules` - Course modules with content and resources
- `progress` - Student progress tracking
- `chat_messages` - AI chat history
- `tts_cache` - Cached audio files
- `user_preferences` - Voice and playback preferences

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Email verification for new accounts
- [ ] Password reset functionality
- [ ] Complete video content for all weeks

### P1 - High Priority
- [ ] Licensing Timeline Gantt chart tool
- [ ] Community discussion board
- [ ] Student networking features
- [ ] Certificate generation upon completion
- [ ] Resource library with search and filtering

### P2 - Medium Priority
- [ ] Advanced financial modeling (3-year sensitivity analysis)
- [ ] Document review AI feature
- [ ] Stripe payment integration
- [ ] Multi-language support (Arabic)
- [ ] Mobile app (PWA)

### P3 - Nice to Have
- [ ] Live cohort scheduling
- [ ] 1-on-1 coaching booking
- [ ] Affiliate program tracking
- [ ] Video DRM/watermarking

## Next Action Items
1. Create complete video content for Weeks 2-12
2. Implement email verification flow
3. Add password reset functionality
4. Build Licensing Timeline Gantt chart tool
5. Add community discussion features
6. Integrate Stripe for payments

## Success Metrics
- Course completion rate target: 60%+
- Tool usage tracking (Market Matrix, Financial Calculator)
- Student satisfaction surveys
- Number of practices launched by graduates
