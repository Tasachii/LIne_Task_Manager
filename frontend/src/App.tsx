import { useEffect, useState } from 'react';
import { Board } from './components/Board';

interface Member {
  id: string;
  name: string;
}

const STORAGE_KEY = 'ltm_member';

// อ่าน/สร้างตัวตนของสมาชิกบนบอร์ด (MVP ยังไม่มี auth)
function loadMember(): Member {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  const fresh = { id: `m_${Math.random().toString(36).slice(2, 9)}`, name: '' };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

export default function App() {
  const [member, setMember] = useState<Member>(loadMember);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
  }, [member]);

  return (
    <div className="app">
      <header className="app__head">
        <div>
          <h1 className="app__title">Line Task Manager</h1>
          <p className="app__sub">Bot ดึงงานจาก LINE → ลากการ์ดผ่าน Todo · In Process · Test · Done</p>
        </div>
        <label className="app__me">
          ฉันคือ
          <input
            className="app__me-input"
            value={member.name}
            placeholder="พิมพ์ชื่อ"
            onChange={(e) => setMember({ ...member, name: e.target.value })}
          />
        </label>
      </header>

      {member.name.trim() ? (
        <Board currentMember={member} />
      ) : (
        <p className="app__hint">ใส่ชื่อด้านบนก่อน แล้วถึงจะกดรับงานได้</p>
      )}
    </div>
  );
}
