import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ViewProfProjectSummary from "./ViewProfProjectSummary"
import { useNavigate } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';

const api = axios.create({
  baseURL: '/api/v1/profProject',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  }
});

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectDetails, setProjectDetails] = useState({
    profId: JSON.parse(localStorage.getItem('faculty'))?._id || '',
    categories: [],
    title: '',
    desc: '',
    startDate: '',
    endDate: '',
    relevantLinks: [],
    files: [],
  });
  const [loading, setLoading] = useState(false);
  const [refreshProjects, setRefreshProjects] = useState(false);
  const [activeTab, setActiveTab] = useState('manage'); // new state for tab

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects/summary');
      setProjects(response.data.data);
    } catch (error) {
      console.error('Error fetching projects:', error.message);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { title, desc, startDate, endDate, categories, relevantLinks, files } = projectDetails;

    if (!title || !desc || !startDate || !endDate || categories.length === 0 || relevantLinks.length === 0) {
      toast.error('All fields are required!');
      setLoading(false);
      return;
    }

    try {
      const isEditing = !!projectDetails.id;

      const formData = new FormData();
      formData.append('profId', projectDetails.profId);
      formData.append('title', title);
      formData.append('desc', desc);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);

      categories.forEach((category) => formData.append('categories[]', category));
      relevantLinks.forEach((link) => formData.append('relevantLinks[]', link));
      files.forEach((file) => formData.append('files', file));

      isEditing
        ? await api.put(`/projects/${projectDetails.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        : await api.post('/projects', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

      toast.success(isEditing ? 'Project updated successfully!' : 'Project added successfully!');
      setProjectDetails({
        profId: JSON.parse(localStorage.getItem('user'))?._id || '',
        categories: [],
        title: '',
        desc: '',
        startDate: '',
        endDate: '',
        relevantLinks: [],
        files: [],
      });

      setRefreshProjects(!refreshProjects); // Trigger re-render of ViewProfProjectSummary
    } catch (error) {
      console.error('Error saving project:', error.message);
      toast.error('Error saving project');
    } finally {
      setLoading(false);
    }
  };

  const [inputValue, setInputValue] = useState('');
  const [stringArray, setStringArray] = useState([]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addBlocks(inputValue);
      setInputValue('');
    }
  };

  const addBlocks = (input) => {
    const values = input.split(',').map((str) => str.trim()).filter(Boolean);
    const newValues = values.filter((value) => !stringArray.includes(value));
    setStringArray([...stringArray, ...newValues]);
    setProjectDetails({
      ...projectDetails,
      categories: [...stringArray, ...newValues],
    });
  };

  const removeBlock = (text) => {
    const updatedArray = stringArray.filter((item) => item !== text);
    setStringArray(updatedArray);
    setProjectDetails({
      ...projectDetails,
      categories: updatedArray,
    });
  };

  const [linkInput, setLinkInput] = useState('');

  const handleLinkChange = (event) => {
    setLinkInput(event.target.value);
  };

  const handleLinkKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleLinkAdd();
    }
  };

  const handleLinkAdd = () => {
    if (linkInput && !projectDetails.relevantLinks.includes(linkInput)) {
      setProjectDetails({
        ...projectDetails,
        relevantLinks: [...projectDetails.relevantLinks, linkInput],
      });
      setLinkInput('');
    }
  };

  const handleLinkRemove = (link) => {
    setProjectDetails({
      ...projectDetails,
      relevantLinks: projectDetails.relevantLinks.filter((item) => item !== link),
    });
  };

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    const uniqueFiles = newFiles.filter(
      (file) => !projectDetails.files.some((existingFile) => existingFile.name === file.name)
    );

    if (uniqueFiles.length > 0) {
      setProjectDetails({
        ...projectDetails,
        files: [...projectDetails.files, ...uniqueFiles],
      });
    } else {
      toast.warning('This file has already been selected.');
    }
  };

  const handleFileRemove = (file) => {
    setProjectDetails({
      ...projectDetails,
      files: projectDetails.files.filter((f) => f.name !== file.name),
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ScrollToTop />
      <ToastContainer />

      {/* Tab Header */}
      <div className="flex mb-4 border-b">
        <button
          className={`px-4 py-2 ${activeTab === 'manage' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-600'}`}
          onClick={() => setActiveTab('manage')}
        >
          Manage Projects
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'summary' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-600'}`}
          onClick={() => setActiveTab('summary')}
        >
          Project Summary
        </button>
      </div>

      {/* Conditionally Render Tab Content */}
      {activeTab === 'manage' && (
        <div>
          <form onSubmit={handleProjectSubmit}>
            <input
              type="text"
              placeholder="Project Title"
              value={projectDetails.title}
              onChange={(e) => setProjectDetails({ ...projectDetails, title: e.target.value })}
              required
              className="mb-2 p-2 border rounded w-full"
            />
            <textarea
              placeholder="Project Description"
              value={projectDetails.desc}
              onChange={(e) => setProjectDetails({ ...projectDetails, desc: e.target.value })}
              required
              className="mb-2 p-2 border rounded w-full"
            />
            <input
              type="date"
              placeholder="Start Date"
              value={projectDetails.startDate}
              onChange={(e) => setProjectDetails({ ...projectDetails, startDate: e.target.value })}
              required
              className="mb-2 p-2 border rounded w-full"
            />
            <input
              type="date"
              placeholder="End Date"
              value={projectDetails.endDate}
              onChange={(e) => setProjectDetails({ ...projectDetails, endDate: e.target.value })}
              required
              className="mb-2 p-2 border rounded w-full"
            />

            {/* Categories input field */}
            <div className="mt-4 mb-2">
              <label htmlFor="categories" className="block text-sm font-semibold">Categories:</label>
              <input
                type="text"
                id="categories"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter categories (comma separated)"
                className="p-2 border rounded w-full"
              />
            </div>

            {/* Display categories */}
            <div className="mt-2 mb-4">
              <div className="flex flex-wrap gap-2">
                {stringArray.map((item, index) => (
                  <span key={index} className="bg-gray-200 px-3 py-1 rounded-full text-sm flex items-center">
                    {item}
                    <span className="ml-2 cursor-pointer text-red-500" onClick={() => removeBlock(item)}>
                      &times;
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Relevant Links */}
            <div className="mt-4 mb-2">
              <label htmlFor="relevantLinks" className="block text-sm font-semibold">Relevant Links:</label>
              <input
                type="text"
                value={linkInput}
                onChange={handleLinkChange}
                onKeyPress={handleLinkKeyPress}
                placeholder="Enter URL"
                className="p-2 border rounded w-full"
              />
              <div className="mt-2">
                {projectDetails.relevantLinks.map((link, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500">{link}</a>
                    <button type="button" onClick={() => handleLinkRemove(link)} className="text-red-500">
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="mt-4 mb-4">
              <label htmlFor="files" className="block text-sm font-semibold">Upload Files:</label>
              <input
                type="file"
                id="files"
                multiple
                onChange={handleFileChange}
                className="p-2 border rounded w-full"
              />
              <div className="mt-2">
                {projectDetails.files.length > 0 && (
                  <div>
                    <p className="font-semibold">Uploaded Files:</p>
                    {projectDetails.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{file.name}</span>
                        <button type="button" onClick={() => handleFileRemove(file)} className="text-red-500">
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded" disabled={loading}>
              {loading ? 'Saving...' : projectDetails.id ? 'Update Project' : 'Add Project'}
            </button>
          </form>
        </div>
      )}
      {activeTab === 'summary' && (
        <div className="mt-6">
          <ViewProfProjectSummary refreshTrigger={refreshProjects} />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;