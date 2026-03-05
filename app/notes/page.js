'use client'

import { useEffect, useState } from 'react';
import { logEvent } from '../../lib/amplitude';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PageHeading from '../components/PageHeading';

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createAccount = (name = 'New Account') => ({
  id: generateId(),
  name,
  collapsed: false,
  tasks: [],
});

const createTask = (title = '') => ({
  id: generateId(),
  title,
  priority: false,
  completed: false,
  assignee: '',
  collapsed: true,
  subtasks: [],
});

const createSubtask = (title = '') => ({
  id: generateId(),
  title,
  completed: false,
});

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const URL_TEST = /https?:\/\/[^\s]+/;
const hasUrl = (text) => URL_TEST.test(text);

const focusElementById = (id) => {
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-focus-id="${id}"]`);
    if (el) el.focus();
  });
};

function GripIcon({ small }) {
  const s = small ? 'w-2 h-3' : 'w-2.5 h-3.5';
  return (
    <svg viewBox="0 0 10 16" fill="currentColor" className={s}>
      <circle cx="3" cy="2" r="1.5" />
      <circle cx="7" cy="2" r="1.5" />
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="7" cy="8" r="1.5" />
      <circle cx="3" cy="14" r="1.5" />
      <circle cx="7" cy="14" r="1.5" />
    </svg>
  );
}

function AutoResizeTextarea({ value, onChange, onBlur, onKeyDown, placeholder, className, autoFocus, focusId }) {
  const ref = (el) => {
    if (!el) return;
    el.style.height = '0';
    el.style.height = `${el.scrollHeight}px`;
    if (autoFocus) el.focus();
  };

  return (
    <textarea
      ref={ref}
      data-focus-id={focusId}
      value={value}
      onChange={(e) => {
        onChange(e);
        e.target.style.height = '0';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={1}
      className={`resize-none overflow-hidden ${className}`}
    />
  );
}

function EditableWithLinks({ value, onChange, onKeyDown, placeholder, className, inputClassName, focusId }) {
  const [editing, setEditing] = useState(false);

  if (editing || !value || !hasUrl(value)) {
    return (
      <AutoResizeTextarea
        value={value}
        onChange={onChange}
        onBlur={() => setEditing(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        autoFocus={editing}
        focusId={focusId}
      />
    );
  }

  const parts = value.split(URL_PATTERN);
  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-text ${className || ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true); }}
    >
      {parts.map((part, i) =>
        hasUrl(part) ? (
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

const STORAGE_KEY = 'account-notes';
const SEED_KEY = 'account-notes-seeded-v2';

export default function NotesPage() {
  const [accounts, setAccounts] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

    if (!localStorage.getItem(SEED_KEY)) {
      const existingNames = new Set(loaded.map((a) => a.name));
      const seeded = buildSeedAccounts().filter(
        (a) => !existingNames.has(a.name)
      );
      loaded = [...loaded, ...seeded];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
      localStorage.setItem(SEED_KEY, 'true');
    }

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
    focusElementById(task.id);
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
      collapsed: false,
    }));
    focusElementById(sub.id);
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

  // --- DnD ---

  const handleAccountDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setAccounts((prev) => {
      const oldIndex = prev.findIndex((a) => a.id === active.id);
      const newIndex = prev.findIndex((a) => a.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    logEvent('Account Reordered');
  };

  const reorderTasks = (accountId, oldIndex, newIndex) => {
    updateAccount(accountId, (a) => ({
      ...a,
      tasks: arrayMove(a.tasks, oldIndex, newIndex),
    }));
    logEvent('Task Reordered', { account_id: accountId });
  };

  // --- Keyboard shortcut helpers ---

  const addTaskAfter = (accountId, afterTaskId) => {
    const task = createTask();
    updateAccount(accountId, (a) => {
      const idx = a.tasks.findIndex((t) => t.id === afterTaskId);
      const tasks = [...a.tasks];
      tasks.splice(idx + 1, 0, task);
      return { ...a, tasks };
    });
    logEvent('Task Created', { account_id: accountId, task_id: task.id });
    focusElementById(task.id);
  };

  const addSubtaskAfter = (accountId, taskId, afterSubtaskId) => {
    const sub = createSubtask();
    updateTask(accountId, taskId, (t) => {
      const idx = t.subtasks.findIndex((s) => s.id === afterSubtaskId);
      const subtasks = [...t.subtasks];
      subtasks.splice(idx + 1, 0, sub);
      return { ...t, subtasks, collapsed: false };
    });
    focusElementById(sub.id);
  };

  const indentTask = (accountId, taskId) => {
    updateAccount(accountId, (a) => {
      const idx = a.tasks.findIndex((t) => t.id === taskId);
      if (idx <= 0) return a;
      const task = a.tasks[idx];
      const newSub = createSubtask(task.title);
      const tasks = a.tasks.filter((_, i) => i !== idx);
      tasks[idx - 1] = {
        ...tasks[idx - 1],
        subtasks: [...tasks[idx - 1].subtasks, newSub],
        collapsed: false,
      };
      return { ...a, tasks };
    });
  };

  const promoteSubtask = (accountId, taskId, subtaskId) => {
    updateAccount(accountId, (a) => {
      const taskIdx = a.tasks.findIndex((t) => t.id === taskId);
      if (taskIdx < 0) return a;
      const task = a.tasks[taskIdx];
      const sub = task.subtasks.find((s) => s.id === subtaskId);
      if (!sub) return a;
      const newTask = createTask(sub.title);
      const updatedTasks = [...a.tasks];
      updatedTasks[taskIdx] = {
        ...task,
        subtasks: task.subtasks.filter((s) => s.id !== subtaskId),
      };
      updatedTasks.splice(taskIdx + 1, 0, newTask);
      return { ...a, tasks: updatedTasks };
    });
  };

  if (!isHydrated) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden text-zen-800">
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-zen-200">
        <PageHeading>Account Notes</PageHeading>
        <button
          onClick={addAccount}
          className="bg-gradient-to-r from-matcha-500 to-glow-500 hover:bg-matcha-600 text-white text-sm font-medium px-4 py-2 rounded-full transition shadow-sm"
        >
          + Add Account
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
        {accounts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zen-400">
            <p className="font-light">No accounts yet. Click &ldquo;Add Account&rdquo; to get started.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAccountDragEnd}>
            <SortableContext items={accounts.map((a) => a.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                {accounts.map((account) => (
                  <SortableAccountCard
                    key={account.id}
                    account={account}
                    onUpdate={(updater) => updateAccount(account.id, updater)}
                    onRemove={() => removeAccount(account.id)}
                    onAddTask={() => addTask(account.id)}
                    onRemoveTask={(taskId) => removeTask(account.id, taskId)}
                    onUpdateTask={(taskId, updater) =>
                      updateTask(account.id, taskId, updater)
                    }
                    onAddSubtask={(taskId) => addSubtask(account.id, taskId)}
                    onRemoveSubtask={(taskId, subtaskId) =>
                      removeSubtask(account.id, taskId, subtaskId)
                    }
                    onUpdateSubtask={(taskId, subtaskId, patch) =>
                      updateSubtask(account.id, taskId, subtaskId, patch)
                    }
                    onReorderTasks={(oldIdx, newIdx) =>
                      reorderTasks(account.id, oldIdx, newIdx)
                    }
                    onAddTaskAfter={(afterTaskId) =>
                      addTaskAfter(account.id, afterTaskId)
                    }
                    onAddSubtaskAfter={(taskId, afterSubId) =>
                      addSubtaskAfter(account.id, taskId, afterSubId)
                    }
                    onIndentTask={(taskId) => indentTask(account.id, taskId)}
                    onPromoteSubtask={(taskId, subtaskId) =>
                      promoteSubtask(account.id, taskId, subtaskId)
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

// --- Sortable wrappers ---

function SortableAccountCard({ account, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <AccountCard
        account={account}
        dragListeners={listeners}
        dragAttributes={attributes}
        {...props}
      />
    </div>
  );
}

function SortableTaskRow({ task, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskRow
        task={task}
        dragListeners={listeners}
        dragAttributes={attributes}
        {...props}
      />
    </div>
  );
}

// --- AccountCard ---

function AccountCard({
  account,
  onUpdate,
  onRemove,
  onAddTask,
  onRemoveTask,
  onUpdateTask,
  onAddSubtask,
  onRemoveSubtask,
  onUpdateSubtask,
  onReorderTasks,
  onAddTaskAfter,
  onAddSubtaskAfter,
  onIndentTask,
  onPromoteSubtask,
  dragListeners,
  dragAttributes,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  const toggleCollapsed = () =>
    onUpdate((a) => ({ ...a, collapsed: !a.collapsed }));

  const handleTaskDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = account.tasks.findIndex((t) => t.id === active.id);
    const newIndex = account.tasks.findIndex((t) => t.id === over.id);
    onReorderTasks(oldIndex, newIndex);
  };

  return (
    <div className="bg-zen-100 glass-card rounded-2xl border border-zen-200 overflow-hidden animate-fade-slide-in">
      {/* Card header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zen-100 border-b border-zen-200">
        <button
          {...dragListeners}
          {...dragAttributes}
          className="text-zen-300 hover:text-zen-500 transition flex-shrink-0 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripIcon />
        </button>

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
          onChange={(e) =>
            onUpdate((a) => ({ ...a, name: e.target.value }))
          }
          className="flex-1 min-w-0 bg-transparent font-medium text-base text-zen-800 focus:outline-none focus:ring-1 focus:ring-matcha-500/50 rounded px-2 py-1 -mx-1"
          placeholder="Account name"
        />

        <span className="text-xs text-zen-500 flex-shrink-0">
          {account.tasks.length} task{account.tasks.length !== 1 ? 's' : ''}
        </span>

        {confirmingDelete ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-red-500 font-medium">Delete?</span>
            <button
              onClick={onRemove}
              className="text-red-500 hover:text-red-600 transition"
              aria-label="Confirm delete"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="text-zen-400 hover:text-zen-600 transition"
              aria-label="Cancel delete"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="text-zen-400 hover:text-red-400 transition flex-shrink-0"
            aria-label="Delete account"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Card body with collapse animation */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          account.collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 py-3 space-y-2 max-h-96 overflow-y-auto bg-zen-50">
            {account.tasks.length === 0 && (
              <p className="text-xs text-zen-400 py-2 font-light">
                No tasks yet.
              </p>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTaskDragEnd}
            >
              <SortableContext
                items={account.tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {account.tasks.map((task) => (
                  <SortableTaskRow
                    key={task.id}
                    task={task}
                    onUpdate={(updater) => onUpdateTask(task.id, updater)}
                    onRemove={() => onRemoveTask(task.id)}
                    onAddSubtask={() => onAddSubtask(task.id)}
                    onRemoveSubtask={(subId) =>
                      onRemoveSubtask(task.id, subId)
                    }
                    onUpdateSubtask={(subId, patch) =>
                      onUpdateSubtask(task.id, subId, patch)
                    }
                    onAddTaskAfter={() => onAddTaskAfter(task.id)}
                    onAddSubtaskAfter={(afterSubId) =>
                      onAddSubtaskAfter(task.id, afterSubId)
                    }
                    onIndentTask={() => onIndentTask(task.id)}
                    onPromoteSubtask={(subId) =>
                      onPromoteSubtask(task.id, subId)
                    }
                  />
                ))}
              </SortableContext>
            </DndContext>

            <button
              onClick={onAddTask}
              className="text-xs text-matcha-400 hover:text-matcha-300 font-medium pt-1"
            >
              + Add task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- TaskRow ---

function TaskRow({
  task,
  onUpdate,
  onRemove,
  onAddSubtask,
  onRemoveSubtask,
  onUpdateSubtask,
  onAddTaskAfter,
  onAddSubtaskAfter,
  onIndentTask,
  onPromoteSubtask,
  dragListeners,
  dragAttributes,
}) {
  const toggleCompleted = () => {
    onUpdate((t) => ({ ...t, completed: !t.completed }));
    logEvent('Task Status Changed', {
      task_id: task.id,
      field: 'completed',
      value: !task.completed,
    });
  };

  const togglePriority = () => {
    onUpdate((t) => ({ ...t, priority: !t.priority }));
    logEvent('Task Status Changed', {
      task_id: task.id,
      field: 'priority',
      value: !task.priority,
    });
  };

  const toggleCollapsed = () =>
    onUpdate((t) => ({ ...t, collapsed: !t.collapsed }));

  const hasSubtasks = task.subtasks.length > 0;

  const handleTaskKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAddSubtask();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      onIndentTask();
    } else if (e.key === 'Escape') {
      e.target.blur();
    } else if (e.key === 'Backspace' && !task.title) {
      e.preventDefault();
      onRemove();
    }
  };

  const handleSubtaskKeyDown = (subId, subTitle) => (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAddSubtaskAfter(subId);
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      onPromoteSubtask(subId);
    } else if (e.key === 'Escape') {
      e.target.blur();
    } else if (e.key === 'Backspace' && !subTitle) {
      e.preventDefault();
      onRemoveSubtask(subId);
    }
  };

  return (
    <div className="group animate-fade-slide-in">
      <div className="flex items-start gap-2 py-2">
        {/* Drag handle */}
        <button
          {...dragListeners}
          {...dragAttributes}
          className="flex-shrink-0 mt-1 text-zen-300 hover:text-zen-500 transition cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
          aria-label="Drag to reorder"
        >
          <GripIcon small />
        </button>

        {/* Expand subtasks toggle */}
        <button
          onClick={toggleCollapsed}
          className={`flex-shrink-0 w-4 h-4 mt-1 flex items-center justify-center text-zen-300 ${
            hasSubtasks ? 'hover:text-zen-600' : ''
          }`}
          disabled={!hasSubtasks}
          aria-label="Toggle subtasks"
        >
          {hasSubtasks && (
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-3 h-3 transition-transform duration-200 ${
                task.collapsed ? '' : 'rotate-90'
              }`}
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Completed checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={toggleCompleted}
          className="flex-shrink-0 w-4 h-4 mt-1 rounded border-zen-300 text-matcha-500 focus:ring-matcha-500/50 cursor-pointer accent-matcha-500"
        />

        {/* Title */}
        <EditableWithLinks
          value={task.title}
          onChange={(e) => onUpdate((t) => ({ ...t, title: e.target.value }))}
          onKeyDown={handleTaskKeyDown}
          placeholder="Task title"
          focusId={task.id}
          className={`flex-1 min-w-0 text-sm break-words px-2 py-1 -mx-1 ${
            task.completed ? 'line-through text-zen-400' : 'text-zen-800'
          }`}
          inputClassName={`flex-1 min-w-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-matcha-500/50 rounded px-2 py-1 -mx-1 ${
            task.completed ? 'line-through text-zen-400' : 'text-zen-800'
          }`}
        />

        {/* Priority star */}
        <button
          onClick={togglePriority}
          className={`flex-shrink-0 transition ${
            task.priority
              ? 'text-amber-500'
              : 'text-zen-300 hover:text-amber-400'
          }`}
          aria-label="Toggle priority"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path
              fillRule="evenodd"
              d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Assignee */}
        <input
          value={task.assignee}
          onChange={(e) => {
            onUpdate((t) => ({ ...t, assignee: e.target.value }));
            if (e.target.value && !task.assignee) {
              logEvent('Task Status Changed', {
                task_id: task.id,
                field: 'assignee',
                value: e.target.value,
              });
            }
          }}
          placeholder="Assign"
          className="flex-shrink-0 w-20 bg-transparent text-xs text-zen-600 focus:outline-none focus:ring-1 focus:ring-matcha-500/50 rounded border border-transparent focus:border-zen-300 px-2 py-1.5 placeholder:text-zen-300"
        />

        {/* Add subtask */}
        <button
          onClick={onAddSubtask}
          className="flex-shrink-0 text-zen-300 hover:text-matcha-500 transition opacity-0 group-hover:opacity-100"
          aria-label="Add subtask"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
        </button>

        {/* Delete task */}
        <button
          onClick={onRemove}
          className="flex-shrink-0 text-zen-300 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
          aria-label="Delete task"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Subtasks with collapse animation */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          task.collapsed || !hasSubtasks
            ? 'grid-rows-[0fr]'
            : 'grid-rows-[1fr]'
        }`}
      >
        <div className="overflow-hidden">
          {hasSubtasks && (
            <div className="ml-10 border-l-2 border-zen-300 pl-4 space-y-1 mt-1">
              {task.subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-start gap-2 py-1.5 group/sub animate-fade-slide-in"
                >
                  <input
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() =>
                      onUpdateSubtask(sub.id, { completed: !sub.completed })
                    }
                    className="flex-shrink-0 w-3.5 h-3.5 mt-0.5 rounded border-zen-300 text-matcha-500 focus:ring-matcha-500/50 cursor-pointer accent-matcha-500"
                  />
                  <EditableWithLinks
                    value={sub.title}
                    onChange={(e) =>
                      onUpdateSubtask(sub.id, { title: e.target.value })
                    }
                    onKeyDown={handleSubtaskKeyDown(sub.id, sub.title)}
                    placeholder="Subtask"
                    focusId={sub.id}
                    className={`flex-1 min-w-0 text-xs break-words px-2 py-1 -mx-1 ${
                      sub.completed
                        ? 'line-through text-zen-400'
                        : 'text-zen-600'
                    }`}
                    inputClassName={`flex-1 min-w-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-matcha-500/50 rounded px-2 py-1 -mx-1 ${
                      sub.completed
                        ? 'line-through text-zen-400'
                        : 'text-zen-600'
                    }`}
                  />
                  <button
                    onClick={() => onRemoveSubtask(sub.id)}
                    className="flex-shrink-0 text-zen-300 hover:text-red-400 transition opacity-0 group-hover/sub:opacity-100"
                    aria-label="Delete subtask"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3 h-3"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
