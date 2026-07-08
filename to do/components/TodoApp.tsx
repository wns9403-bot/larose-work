"use client";

import { useEffect, useState } from "react";

type Todo = {
  id: string;
  text: string;
  done: boolean;
};

type Filter = "all" | "active" | "done";

const STORAGE_KEY = "todos";

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loaded, setLoaded] = useState(false);

  // localStorage에서 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setTodos(JSON.parse(saved));
    } catch {
      // 저장된 값이 손상된 경우 무시
    }
    setLoaded(true);
  }, []);

  // 변경 시 저장
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos, loaded]);

  function addTodo() {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      { id: crypto.randomUUID(), text, done: false },
      ...prev,
    ]);
    setInput("");
  }

  function toggle(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function remove(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function clearDone() {
    setTodos((prev) => prev.filter((t) => !t.done));
  }

  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "done" ? t.done : true
  );
  const remaining = todos.filter((t) => !t.done).length;

  return (
    <div className="app">
      <div className="header">
        <h1>할 일 관리</h1>
        <p>오늘 해야 할 일을 정리해 보세요</p>
      </div>

      <div className="input-row">
        <input
          type="text"
          placeholder="할 일을 입력하세요"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
        />
        <button onClick={addTodo}>추가</button>
      </div>

      <div className="filters">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          전체
        </button>
        <button
          className={filter === "active" ? "active" : ""}
          onClick={() => setFilter("active")}
        >
          진행 중
        </button>
        <button
          className={filter === "done" ? "active" : ""}
          onClick={() => setFilter("done")}
        >
          완료
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="empty">
          {filter === "done"
            ? "완료된 할 일이 없습니다."
            : filter === "active"
              ? "진행 중인 할 일이 없습니다."
              : "할 일을 추가해 보세요."}
        </p>
      ) : (
        <ul className="list">
          {visible.map((t) => (
            <li key={t.id} className="item">
              <span
                className={`check ${t.done ? "done" : ""}`}
                onClick={() => toggle(t.id)}
                role="checkbox"
                aria-checked={t.done}
              />
              <span className={`label ${t.done ? "done" : ""}`}>{t.text}</span>
              <button
                className="del"
                onClick={() => remove(t.id)}
                aria-label="삭제"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="footer">
        <span>{remaining}개 남음</span>
        <button onClick={clearDone}>완료 항목 지우기</button>
      </div>
    </div>
  );
}
