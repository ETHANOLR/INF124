import { useState, useEffect } from 'react';
import axios from 'axios';

function TestPage() {

  // 用来管理用户的输入（创建用户：username， email， password）
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [users, setUsers] = useState([]);

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username) return;

    try {
      await axios.post('http://localhost:4000/api/users', form);
      setForm({ username: '', email: '', password: '' }); // 清空表单
      alert('User created successfully!'); // 提示用户创建成功
      fetchUsers(); // 更新展示数据
    } catch (err) {
      console.error(err);
    }
  };

  // 获取数据库用户数据
  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>添加用户</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">Submit</button>
      </form>

      <h3>数据库中的用户</h3>
      <ul>
        {users.map((user) => (
          <li key={user._id}>
            <strong>{user.username}</strong> | {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TestPage;
