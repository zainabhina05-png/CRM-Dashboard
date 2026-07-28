# LeadFlow CRM - Product Definition

## What This CRM Is

LeadFlow is a production-ready Customer Relationship Management platform designed for modern sales teams. It provides a complete lead pipeline management system with drag-and-drop Kanban boards, real-time analytics, and enterprise-grade security.

## User Roles & Permissions

### Sales Representative (sales_rep)
- **Lead Management**: Create, read, update own leads
- **Pipeline**: Move own leads through all pipeline stages 
- **Activities**: Log notes, calls, emails, meetings on own leads
- **Reminders**: Create and manage follow-up tasks for own leads
- **Analytics**: View personal performance metrics and lead statistics

### Manager (manager)  
- **All Sales Rep Permissions**: Complete access to sales rep functionality
- **Team Oversight**: View team performance and lead metrics
- **Data Export**: Generate CSV exports of filtered lead data
- **Advanced Analytics**: Access team-wide reporting and trend analysis
- **Deal Closure**: Authority to mark deals as Won/Lost

### Administrator (admin)
- **All Manager Permissions**: Complete manager functionality
- **User Management**: Create, update, delete user accounts
- **System Administration**: Access to system-wide settings and configuration
- **Data Management**: Bulk operations, lead deletion, data cleanup
- **Security Oversight**: Access to audit logs and security settings

## Complete Feature Inventory

### Authentication & User Management
- User registration with email verification
- Secure login with JWT access tokens (15min) + httpOnly refresh tokens (7 days)
- Token rotation and reuse detection
- Role-based access control with server-side enforcement
- Password reset functionality
- Session management with persistent login

### Lead Management System
- **Full CRUD Operations**: Create, read, update, delete leads
- **Duplicate Detection**: Automatic detection of potential duplicate leads with merge options
- **Custom Fields**: Up to 10 configurable custom fields per lead
- **Tag System**: Flexible tagging with up to 20 tags per lead
- **Activity Timeline**: Complete history of all interactions and status changes
- **Lead Sources**: Track lead origin (website, referral, social media, paid ads, cold call, other)
- **Lead Assignment**: Assign leads to specific sales representatives

### Kanban Pipeline System  
- **6-Stage Pipeline**: New → Contacted → Qualified → Proposal → Won → Lost
- **Drag & Drop Interface**: Smooth @dnd-kit powered card movement
- **Real-time Updates**: Immediate pipeline state synchronization
- **Stage-based Analytics**: Performance metrics per pipeline stage
- **Bulk Operations**: Move multiple leads simultaneously
- **Pipeline Customization**: Configurable stage names and workflow rules

### Analytics & Reporting Dashboard
- **Status Distribution**: Visual breakdown of leads by pipeline stage
- **Source Analysis**: Lead generation by acquisition channel  
- **Win/Loss Metrics**: Conversion rates and closed deal statistics
- **Monthly Trends**: 12-month historical performance charts
- **Team Performance**: Comparative metrics across sales representatives
- **Export Capabilities**: CSV export with advanced filtering

### Reminder & Task Management
- **Follow-up Scheduling**: Set due dates for lead follow-ups
- **Email Notifications**: Automated reminder emails via Nodemailer
- **Task Completion Tracking**: Mark reminders as complete with timestamps
- **Lead Association**: Link reminders to specific leads
- **Bulk Reminder Operations**: Manage multiple reminders efficiently

### Data Integration & Webhooks
- **Inbound Webhooks**: Capture leads from external sources (Facebook Lead Ads, Zapier)
- **HMAC Signature Verification**: Secure webhook authentication
- **Lead Auto-assignment**: Automatic lead routing to designated users
- **Duplicate Prevention**: Skip creation of duplicate webhook leads
- **Integration Logging**: Track all inbound lead capture events

### Advanced Features
- **Search & Filtering**: Full-text search across leads with advanced filters
- **Pagination**: Efficient data loading for large lead databases  
- **Responsive Design**: Mobile, tablet, and desktop optimized interface
- **Dark Mode Support**: Theme switching capability
- **Data Validation**: Comprehensive input sanitization and validation
- **Error Handling**: Graceful error management with user-friendly messages

## Pipeline Business Rules

### Stage Progression Rules
- **Linear Progression**: Leads typically move forward through stages sequentially
- **Skip Stages Allowed**: Users can move leads directly to any later stage
- **Backward Movement**: Leads can be moved back to earlier stages if needed
- **Terminal Stages**: Won and Lost are final states (no further progression)

### Role-based Stage Restrictions
- **Sales Rep**: Can move own leads through all stages
- **Manager**: Can close deals (move to Won/Lost) for team members
- **Admin**: Full pipeline permissions including deletion

### Required Status Change Logging
- All status changes must be logged in activity timeline
- Include previous status, new status, timestamp, and user who made change
- Automatic activity creation with system-generated descriptions

## Data Ownership Model

### Lead Ownership
- Every lead has exactly one owner (the assigned sales representative)  
- Owner has full CRUD permissions on their leads
- Managers can view team leads but not modify without assignment
- Admins have unrestricted access for system administration

### Cross-team Visibility
- Sales reps see only their assigned leads
- Managers see all leads from their team members
- Admins see all leads system-wide
- Analytics respect ownership boundaries for non-admin users

## Security & Compliance Requirements

### Data Protection
- All passwords hashed with bcrypt (minimum 12 salt rounds)
- No password values ever returned in API responses  
- JWT tokens expire and rotate automatically
- Rate limiting on authentication and sensitive endpoints

### Access Control
- Server-side authorization on all protected routes
- Role verification before data access or modification
- CORS restrictions to prevent unauthorized domain access
- Input validation and XSS prevention on all user inputs

### Audit Requirements
- Activity logging for all lead modifications
- User action tracking for security events
- Failed authentication attempt monitoring
- Data export tracking for compliance

## Success Criteria - "Done" Definition

### Functional Completeness
- [ ] All existing features continue working without regression
- [ ] New security requirements fully implemented and tested
- [ ] Demo seed system operational with production safety guards
- [ ] Design system established with consistent token usage

### Security Standards
- [ ] OWASP Top 10 vulnerabilities addressed
- [ ] Server-side authorization on all endpoints
- [ ] Kanban pipeline security requirements (G1-G8) implemented
- [ ] Rate limiting and abuse prevention active

### Quality Assurance
- [ ] 75% backend test coverage achieved
- [ ] 70% frontend test coverage achieved  
- [ ] 100% critical path E2E test coverage
- [ ] All tests passing in CI environment

### Deployment & Performance
- [ ] 404 deployment issues resolved
- [ ] Live demo accessible with working functionality
- [ ] Lighthouse performance scores ≥80 across all metrics
- [ ] DEMO_CREDENTIALS.md generated with working login details

### Documentation & Handoff
- [ ] Technical documentation updated
- [ ] API endpoints documented
- [ ] Deployment instructions verified
- [ ] Security testing procedures documented

The project is considered complete when all checklist items are verified and the live deployment demonstrates full functionality matching the feature inventory above.