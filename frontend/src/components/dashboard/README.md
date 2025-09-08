# Dashboard Widgets

This directory contains reusable dashboard widgets for the BizRadar application.

## DeadlinesNextWidget

A comprehensive widget that displays upcoming deadlines from the user's pursuit tracker with dynamic filtering and quick actions.

### Features

- **Dynamic Time Filtering**: Choose between 7, 14, or 28 days to view upcoming deadlines
- **Type Filtering**: Filter by deadline type (All, Proposal, Q&A, Amendment, Site Visit)
- **Color-Coded Urgency**: Visual indicators for deadline urgency:
  - Red: Overdue or due within 2 days
  - Amber: Due within 3-7 days  
  - Gray: Due in more than 7 days
- **Quick Actions**:
  - View: Opens pursuit details in new tab
  - Add to Calendar: Creates Google Calendar event
  - Mark Submitted: Updates pursuit status
- **Bulk Export**: Export all deadlines as .ics calendar file

### Data Structure

```typescript
interface DeadlineRow {
  oppId: string;
  title: string;
  agency?: string;
  solicitation?: string;
  type: 'proposal' | 'qa' | 'amendment' | 'site_visit' | 'all';
  dueAt: string; // ISO string
  daysLeft: number;
  stage: string;
  owner?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  setAsides?: string[];
}
```

### Usage

```tsx
import DeadlinesNextWidget from '@/components/dashboard/DeadlinesNextWidget';

function Dashboard() {
  return (
    <div>
      <DeadlinesNextWidget className="mb-6" />
    </div>
  );
}
```

### Database Dependencies

- Requires `pursuits` table with fields: `id`, `title`, `stage`, `due_date`, `is_submitted`, `user_id`
- Filters out submitted pursuits and those without due dates
- Orders results by due date (ascending)

### Styling

Uses Tailwind CSS classes with consistent design patterns:
- Rounded corners (`rounded-xl`)
- Shadow effects (`shadow-sm`)
- Hover states for interactive elements
- Responsive design considerations
- Color-coded urgency indicators

### Future Enhancements

- Integration with external calendar systems (Outlook, Apple Calendar)
- Email notifications for approaching deadlines
- Bulk actions (assign, reschedule, etc.)
- Custom deadline types
- Advanced filtering options
