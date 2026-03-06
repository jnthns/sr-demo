'use client'

import { useEffect, useState, useRef } from 'react';
import { logEvent } from '../../lib/amplitude';
import PageHeading from '../components/PageHeading';

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const STATUSES = [
  { value: 'todo', label: 'To Do', dotClass: 'bg-zen-400' },
  { value: 'in_progress', label: 'In Progress', dotClass: 'bg-blue-400' },
  { value: 'blocked', label: 'Customer', dotClass: 'bg-emerald-400' },
  { value: 'done', label: 'Blocked', dotClass: 'bg-red-400' },
];

const ROW_COLORS = [
  { value: null, label: 'None', className: '' },
  { value: 'red', label: 'Red', bg: 'bg-red-500/10', border: 'border-l-red-400', dot: 'bg-red-400' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500/10', border: 'border-l-orange-400', dot: 'bg-orange-400' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500/10', border: 'border-l-yellow-400', dot: 'bg-yellow-400' },
  { value: 'green', label: 'Green', bg: 'bg-emerald-500/10', border: 'border-l-emerald-400', dot: 'bg-emerald-400' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500/10', border: 'border-l-blue-400', dot: 'bg-blue-400' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500/10', border: 'border-l-purple-400', dot: 'bg-purple-400' },
];

const getColorConfig = (color) => ROW_COLORS.find((c) => c.value === color) || ROW_COLORS[0];
const getStatusConfig = (status) => STATUSES.find((s) => s.value === status) || STATUSES[0];

const createAccount = (name = 'New Account') => ({
  id: generateId(),
  name,
  collapsed: false,
  tasks: [],
});

const createTask = (title = '') => ({
  id: generateId(),
  title,
  status: 'todo',
  color: null,
  assignee: '',
  subtasks: [],
});

const createSubtask = (title = '') => ({
  id: generateId(),
  title,
  status: 'todo',
  color: null,
});

const STORAGE_KEY = 'account-notes';

function migrateAccounts(data) {
  return data.map((account) => ({
    ...account,
    tasks: (account.tasks || []).map((task) => ({
      status: task.completed ? 'done' : 'todo',
      color: null,
      assignee: '',
      ...task,
      completed: undefined,
      priority: undefined,
      collapsed: undefined,
      subtasks: (task.subtasks || []).map((sub) => ({
        status: sub.completed ? 'done' : 'todo',
        color: null,
        ...sub,
        completed: undefined,
      })),
    })),
  }));
}

const focusInput = (id) => {
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-focus-id="${id}"]`);
    if (el) el.focus();
  });
};

// --- Dropdown for status / color pickers ---

function Popover({ trigger, children, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        dropdownRef.current?.contains(e.target)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: align === 'right' ? rect.right : rect.left,
      });
    }
    setOpen(!open);
  };

  return (
    <>
      <div ref={triggerRef} onClick={toggle}>{trigger}</div>
      {open && (
        <div
          ref={dropdownRef}
          className="fixed z-[100] py-1 rounded-lg border border-zen-200 bg-zen-100 glass-card shadow-xl min-w-[140px]"
          style={{
            top: pos.top,
            left: align === 'right' ? undefined : pos.left,
            right: align === 'right' ? window.innerWidth - pos.left : undefined,
          }}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </>
  );
}

function StatusBadge({ status, onChange }) {
  const cfg = getStatusConfig(status);
  return (
    <Popover
      trigger={
        <button className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-zen-200 hover:border-zen-300 transition bg-zen-50">
          <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
          <span className="text-zen-600">{cfg.label}</span>
        </button>
      }
    >
      {(close) => (
        <div className="py-1">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => { onChange(s.value); close(); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-zen-200 transition ${
                s.value === status ? 'text-zen-800 font-medium' : 'text-zen-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${s.dotClass}`} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

function ColorPicker({ color, onChange }) {
  const cfg = getColorConfig(color);
  return (
    <Popover
      trigger={
        <button
          className="w-5 h-5 rounded-full border border-zen-200 hover:border-zen-300 transition flex items-center justify-center"
          aria-label="Set color"
        >
          {cfg.value ? (
            <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
          ) : (
            <span className="w-3 h-3 rounded-full border border-dashed border-zen-300" />
          )}
        </button>
      }
    >
      {(close) => (
        <div className="py-1">
          {ROW_COLORS.map((c) => (
            <button
              key={c.value || 'none'}
              onClick={() => { onChange(c.value); close(); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-zen-200 transition ${
                c.value === color ? 'text-zen-800 font-medium' : 'text-zen-600'
              }`}
            >
              {c.value ? (
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full border border-dashed border-zen-300" />
              )}
              {c.label}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

// --- Inline editable cell with auto-linked URLs ---

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const URL_TEST = /https?:\/\/[^\s]+/;

function EditableCell({ value, onChange, onKeyDown, placeholder, className = '', focusId }) {
  const [editing, setEditing] = useState(false);

  if (editing || !value || !URL_TEST.test(value)) {
    return (
      <input
        data-focus-id={focusId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => setEditing(false)}
        autoFocus={editing}
        placeholder={placeholder}
        className={`bg-transparent focus:outline-none focus:ring-1 focus:ring-matcha-500/50 rounded px-1.5 py-1 w-full ${className}`}
      />
    );
  }

  const parts = value.split(URL_PATTERN);
  return (
    <span
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true); }}
      role="button"
      tabIndex={0}
      className={`cursor-text truncate px-1.5 py-1 w-full block ${className}`}
    >
      {parts.map((part, i) =>
        URL_TEST.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-matcha-400 hover:text-matcha-300 underline decoration-matcha-400/30"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// --- Main Page ---

export default function NotesPage() {
  const [accounts, setAccounts] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let loaded = [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) loaded = parsed;
      } catch (err) {
        console.warn('Failed to load account notes:', err);
      }
    }
    loaded = migrateAccounts(loaded);
    setAccounts(loaded);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts, isHydrated]);

  // --- CRUD ---

  const updateAccount = (accountId, updater) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? updater(a) : a))
    );
  };

  const updateTask = (accountId, taskId, updater) => {
    updateAccount(accountId, (a) => ({
      ...a,
      tasks: a.tasks.map((t) => (t.id === taskId ? updater(t) : t)),
    }));
  };

  const addAccount = () => {
    const acct = createAccount();
    setAccounts((prev) => [...prev, acct]);
    logEvent('Account Created', { account_id: acct.id });
  };

  const removeAccount = (accountId) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    logEvent('Account Deleted', { account_id: accountId });
  };

  const addTask = (accountId) => {
    const task = createTask();
    updateAccount(accountId, (a) => ({ ...a, tasks: [...a.tasks, task] }));
    logEvent('Task Created', { account_id: accountId, task_id: task.id });
    focusInput(task.id);
  };

  const removeTask = (accountId, taskId) => {
    updateAccount(accountId, (a) => ({
      ...a,
      tasks: a.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const addSubtask = (accountId, taskId) => {
    const sub = createSubtask();
    updateTask(accountId, taskId, (t) => ({
      ...t,
      subtasks: [...t.subtasks, sub],
    }));
    focusInput(sub.id);
  };

  const removeSubtask = (accountId, taskId, subtaskId) => {
    updateTask(accountId, taskId, (t) => ({
      ...t,
      subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
    }));
  };

  const updateSubtask = (accountId, taskId, subtaskId, patch) => {
    updateTask(accountId, taskId, (t) => ({
      ...t,
      subtasks: t.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, ...patch } : s
      ),
    }));
  };

  if (!isHydrated) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden text-zen-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-zen-200">
        <PageHeading>Account Notes</PageHeading>
        <button
          onClick={addAccount}
          className="bg-gradient-to-r from-matcha-500 to-glow-500 hover:opacity-90 text-white text-sm font-medium px-4 py-2 rounded-full transition shadow-sm"
        >
          + Add Account
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {accounts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zen-400">
            <p className="font-light">No accounts yet. Click &ldquo;Add Account&rdquo; to get started.</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto border border-zen-200 rounded-2xl overflow-hidden my-4">
            {/* Column headers */}
            <div className="sticky top-0 z-20 bg-zen-100 glass border-b border-zen-200">
              <div className="grid grid-cols-[1fr_120px_44px_120px_36px] gap-2 px-6 py-2 text-xs font-semibold text-zen-500 uppercase tracking-wider">
                <span>Title</span>
                <span>Status</span>
                <span className="text-center">Color</span>
                <span>Assignee</span>
                <span />
              </div>
            </div>

            {accounts.map((account) => (
              <AccountSection
                key={account.id}
                account={account}
                onUpdateAccount={(updater) => updateAccount(account.id, updater)}
                onRemoveAccount={() => removeAccount(account.id)}
                onAddTask={() => addTask(account.id)}
                onRemoveTask={(taskId) => removeTask(account.id, taskId)}
                onUpdateTask={(taskId, updater) => updateTask(account.id, taskId, updater)}
                onAddSubtask={(taskId) => addSubtask(account.id, taskId)}
                onRemoveSubtask={(taskId, subId) => removeSubtask(account.id, taskId, subId)}
                onUpdateSubtask={(taskId, subId, patch) => updateSubtask(account.id, taskId, subId, patch)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Account group header + its task/subtask rows ---

function AccountSection({
  account,
  onUpdateAccount,
  onRemoveAccount,
  onAddTask,
  onRemoveTask,
  onUpdateTask,
  onAddSubtask,
  onRemoveSubtask,
  onUpdateSubtask,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  const toggleCollapsed = () =>
    onUpdateAccount((a) => ({ ...a, collapsed: !a.collapsed }));

  const taskCount = account.tasks.length;
  const doneCount = account.tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="border-b border-zen-200">
      {/* Account header row */}
      <div className="flex items-center gap-2 px-6 py-3 bg-zen-50 hover:bg-zen-100 transition group">
        <button
          onClick={toggleCollapsed}
          className="text-zen-400 hover:text-zen-600 transition flex-shrink-0"
          aria-label={account.collapsed ? 'Expand' : 'Collapse'}
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transition-transform duration-200 ${account.collapsed ? '' : 'rotate-90'}`}
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <input
          value={account.name}
          onChange={(e) => onUpdateAccount((a) => ({ ...a, name: e.target.value }))}
          className="flex-1 min-w-0 bg-transparent font-semibold text-sm text-zen-800 focus:outline-none focus:ring-1 focus:ring-matcha-500/50 rounded px-2 py-1"
          placeholder="Account name"
        />

        <span className="text-xs text-zen-400 flex-shrink-0 tabular-nums">
          {doneCount}/{taskCount}
        </span>

        <button
          onClick={onAddTask}
          className="text-xs text-matcha-400 hover:text-matcha-300 font-medium opacity-0 group-hover:opacity-100 transition flex-shrink-0"
        >
          + Task
        </button>

        {confirmingDelete ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-red-400">Delete?</span>
            <button onClick={onRemoveAccount} className="text-red-400 hover:text-red-500 transition">
              <CheckIcon />
            </button>
            <button onClick={() => setConfirmingDelete(false)} className="text-zen-400 hover:text-zen-600 transition">
              <XIcon />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="text-zen-300 hover:text-red-400 transition opacity-0 group-hover:opacity-100 flex-shrink-0"
            aria-label="Delete account"
          >
            <XIcon />
          </button>
        )}
      </div>

      {/* Task rows with collapse animation */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          account.collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
        }`}
      >
        <div className="overflow-hidden">
          {account.tasks.length === 0 && !account.collapsed && (
            <div className="px-6 py-3">
              <button
                onClick={onAddTask}
                className="text-xs text-zen-400 hover:text-matcha-400 transition"
              >
                + Add a task to get started
              </button>
            </div>
          )}
          {account.tasks.map((task) => (
            <TaskRowGroup
              key={task.id}
              task={task}
              onUpdateTask={(updater) => onUpdateTask(task.id, updater)}
              onRemoveTask={() => onRemoveTask(task.id)}
              onAddSubtask={() => onAddSubtask(task.id)}
              onRemoveSubtask={(subId) => onRemoveSubtask(task.id, subId)}
              onUpdateSubtask={(subId, patch) => onUpdateSubtask(task.id, subId, patch)}
            />
          ))}

          {account.tasks.length > 0 && (
            <div className="px-6 py-2 flex items-center gap-4">
              <button
                onClick={onAddTask}
                className="text-xs text-zen-400 hover:text-matcha-400 transition"
              >
                + Add task
              </button>
              <button
                onClick={() => onAddSubtask(account.tasks[account.tasks.length - 1].id)}
                className="text-xs text-zen-400 hover:text-matcha-400 transition"
              >
                + Add subtask
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Task row + subtask rows beneath it ---

function TaskRowGroup({
  task,
  onUpdateTask,
  onRemoveTask,
  onAddSubtask,
  onRemoveSubtask,
  onUpdateSubtask,
}) {
  const colorCfg = getColorConfig(task.color);
  const isDone = task.status === 'done';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAddSubtask();
    } else if (e.key === 'Backspace' && !task.title) {
      e.preventDefault();
      onRemoveTask();
    }
  };

  return (
    <>
      {/* Task row */}
      <div
        className={`grid grid-cols-[1fr_120px_44px_120px_36px] gap-2 items-center px-6 py-1.5 border-t border-zen-200/50 hover:bg-zen-50 transition group ${
          colorCfg.value ? `border-l-2 ${colorCfg.border}` : 'border-l-2 border-l-transparent'
        }`}
      >
        {/* Title */}
        <div className="flex items-center gap-2 min-w-0">
          <EditableCell
            value={task.title}
            onChange={(val) => onUpdateTask((t) => ({ ...t, title: val }))}
            onKeyDown={handleKeyDown}
            placeholder="Task title"
            focusId={task.id}
            className={`text-sm ${isDone ? 'line-through text-zen-400' : 'text-zen-800'}`}
          />
        </div>

        {/* Status */}
        <StatusBadge
          status={task.status}
          onChange={(val) => {
            onUpdateTask((t) => ({ ...t, status: val }));
            logEvent('Task Status Changed', { task_id: task.id, status: val });
          }}
        />

        {/* Color */}
        <div className="flex justify-center">
          <ColorPicker
            color={task.color}
            onChange={(val) => onUpdateTask((t) => ({ ...t, color: val }))}
          />
        </div>

        {/* Assignee */}
        <EditableCell
          value={task.assignee}
          onChange={(val) => {
            onUpdateTask((t) => ({ ...t, assignee: val }));
            if (val && !task.assignee) {
              logEvent('Task Status Changed', { task_id: task.id, field: 'assignee', value: val });
            }
          }}
          placeholder="Assignee"
          className="text-xs text-zen-600"
        />

        {/* Actions */}
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={onAddSubtask}
            className="text-zen-300 hover:text-matcha-500 transition opacity-0 group-hover:opacity-100"
            aria-label="Add subtask"
          >
            <PlusIcon />
          </button>
          <button
            onClick={onRemoveTask}
            className="text-zen-300 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
            aria-label="Delete task"
          >
            <XIcon />
          </button>
        </div>
      </div>

      {/* Subtask rows */}
      {task.subtasks.map((sub) => (
        <SubtaskRow
          key={sub.id}
          sub={sub}
          parentColor={task.color}
          onUpdate={(patch) => onUpdateSubtask(sub.id, patch)}
          onRemove={() => onRemoveSubtask(sub.id)}
        />
      ))}
    </>
  );
}

// --- Subtask row ---

function SubtaskRow({ sub, parentColor, onUpdate, onRemove }) {
  const colorCfg = getColorConfig(sub.color || parentColor);
  const isDone = sub.status === 'done';

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && !sub.title) {
      e.preventDefault();
      onRemove();
    }
  };

  return (
    <div
      className={`grid grid-cols-[1fr_120px_44px_120px_36px] gap-2 items-center px-6 py-1 border-t border-zen-200/30 hover:bg-zen-50 transition group ${
        colorCfg.value ? `border-l-2 ${colorCfg.border}` : 'border-l-2 border-l-transparent'
      }`}
    >
      {/* Title (indented) */}
      <div className="flex items-center gap-2 min-w-0 pl-6">
        <span className="text-zen-300 flex-shrink-0">&#8627;</span>
        <EditableCell
          value={sub.title}
          onChange={(val) => onUpdate({ title: val })}
          onKeyDown={handleKeyDown}
          placeholder="Subtask"
          focusId={sub.id}
          className={`text-xs ${isDone ? 'line-through text-zen-400' : 'text-zen-600'}`}
        />
      </div>

      {/* Status */}
      <StatusBadge
        status={sub.status}
        onChange={(val) => onUpdate({ status: val })}
      />

      {/* Color */}
      <div className="flex justify-center">
        <ColorPicker
          color={sub.color}
          onChange={(val) => onUpdate({ color: val })}
        />
      </div>

      {/* Empty assignee column for alignment */}
      <span />

      {/* Actions */}
      <div className="flex items-center justify-end">
        <button
          onClick={onRemove}
          className="text-zen-300 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
          aria-label="Delete subtask"
        >
          <XIcon size="sm" />
        </button>
      </div>
    </div>
  );
}

// --- Icons ---

function XIcon({ size }) {
  const s = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={s}>
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  );
}
