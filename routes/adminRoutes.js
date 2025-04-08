const express = require('express');
const { get } = require('@vercel/edge-config');

const router = express.Router();

const EDGE_CONFIG_URL = 'https://api.vercel.com/v1/edge-config/ecfg_r5ttjeq5fpdwcyl7muoowf83nad1/items';
const API_TOKEN = 'Bearer 58W6mvFK9bVdAHyxRzAr0Aql';

// Helper function to update Edge Config
async function patchEdgeConfig(key, value) {
  try {
    const response = await fetch(EDGE_CONFIG_URL, {
      method: 'PATCH',
      headers: {
        Authorization: API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'update',
            key,
            value,
          },
        ],
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Edge Config update failed: ${result.message || 'Unknown error'}`);
    }
    console.log(`Updated ${key}:`, result);
    return result;
  } catch (error) {
    console.error(`Error updating ${key}:`, error);
    throw error;
  }
}

// ===================== Experience =====================

// Experience Bilgilerini Listele
router.get('/experience', async (req, res) => {
  try {
    const experiences = (await get('experiences')) || [];
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Yeni Experience Bilgisi Ekle
router.post('/experience', async (req, res) => {
  const { title, company, start_date, end_date, description } = req.body;

  try {
    let experiences = (await get('experiences')) || [];
    const newId = experiences.length > 0 ? Math.max(...experiences.map(exp => Number(exp.id))) + 1 : 1;

    const newExperience = {
      id: newId.toString(), // ID'yi string olarak tutuyoruz, veri yapınıza uygun
      title,
      company,
      start_date,
      end_date,
      description,
    };

    experiences.push(newExperience);
    await patchEdgeConfig('experiences', experiences);

    res.status(201).json(newExperience);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Experience Bilgisi Silme
router.delete('/experience/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let experiences = (await get('experiences')) || [];
    const filteredExperiences = experiences.filter(exp => exp.id !== id);

    if (filteredExperiences.length === experiences.length) {
      return res.status(404).json({ message: 'Deneyim bulunamadı' });
    }

    await patchEdgeConfig('experiences', filteredExperiences);
    res.status(200).json({ message: 'Deneyim bilgisi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Experience Güncelleme
async function updateExperience(id, updatedData) {
  try {
    let experiences = (await get('experiences')) || [];
    const index = experiences.findIndex(exp => exp.id === id);

    if (index === -1) {
      throw new Error('Experience not found');
    }

    experiences[index] = { ...experiences[index], ...updatedData };
    await patchEdgeConfig('experiences', experiences);

    return experiences[index];
  } catch (error) {
    console.error('Error updating experience:', error);
    throw new Error('Failed to update experience');
  }
}

router.put('/experience/:id', async (req, res) => {
  const { id } = req.params;
  const { title, company, start_date, end_date, description } = req.body;

  if (!title || !company || !start_date || !description) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await updateExperience(id, { title, company, start_date, end_date, description });
    res.status(200).json({ message: 'Experience updated successfully' });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({
      message: `Server error: ${error.message}`,
      requestBody: req.body,
    });
  }
});

// ===================== Education =====================

// Education Bilgilerini Listele
router.get('/education', async (req, res) => {
  try {
    const education = (await get('education')) || [];
    res.json(education);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Yeni Education Bilgisi Ekle
router.post('/education', async (req, res) => {
  const { school, degree, field, startDate, endDate, description } = req.body;

  try {
    let education = (await get('education')) || [];
    const newId = education.length > 0 ? Math.max(...education.map(edu => Number(edu.id))) + 1 : 1;

    const newEducation = {
      id: newId.toString(), // ID'yi string olarak tutuyoruz
      school,
      degree,
      field,
      startDate,
      endDate,
      description,
    };

    education.push(newEducation);
    await patchEdgeConfig('education', education);

    res.status(201).json(newEducation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Education Bilgisi Silme
router.delete('/education/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let education = (await get('education')) || [];
    const filteredEducation = education.filter(edu => edu.id !== id);

    if (filteredEducation.length === education.length) {
      return res.status(404).json({ message: 'Eğitim bulunamadı' });
    }

    await patchEdgeConfig('education', filteredEducation);
    res.status(200).json({ message: 'Eğitim bilgisi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Education Güncelleme
async function updateEducation(id, updatedData) {
  try {
    let education = (await get('education')) || [];
    const index = education.findIndex(edu => edu.id === id);

    if (index === -1) {
      throw new Error('Education not found');
    }

    education[index] = { ...education[index], ...updatedData };
    await patchEdgeConfig('education', education);

    return education[index];
  } catch (error) {
    console.error('Error updating education:', error);
    throw new Error('Failed to update education');
  }
}

router.put('/education/:id', async (req, res) => {
  const { id } = req.params;
  const { school, degree, field, startDate, endDate, description } = req.body;

  if (!school || !degree || !field || !startDate || !description) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await updateEducation(id, { school, degree, field, startDate, endDate, description });
    res.status(200).json({ message: 'Eğitim bilgisi güncellendi' });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({
      message: `Sunucu hatası: ${error.message}`,
      requestBody: req.body,
    });
  }
});

// ===================== Projects =====================

// Projects Bilgilerini Listele
router.get('/projects', async (req, res) => {
  try {
    const projects = (await get('projects')) || [];
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Yeni Project Bilgisi Ekle
router.post('/projects', async (req, res) => {
  const { title, description, imageUrl, projectUrl } = req.body;

  try {
    let projects = (await get('projects')) || [];
    const newId = projects.length > 0 ? Math.max(...projects.map(proj => Number(proj.id))) + 1 : 1;

    const newProject = {
      id: newId.toString(), // ID'yi string olarak tutuyoruz
      title,
      description,
      imageUrl,
      projectUrl,
    };

    projects.push(newProject);
    await patchEdgeConfig('projects', projects);

    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Project Bilgisi Silme
router.delete('/projects/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let projects = (await get('projects')) || [];
    const filteredProjects = projects.filter(proj => proj.id !== id);

    if (filteredProjects.length === projects.length) {
      return res.status(404).json({ message: 'Proje bulunamadı' });
    }

    await patchEdgeConfig('projects', filteredProjects);
    res.status(200).json({ message: 'Proje silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Project Güncelleme
async function updateProject(id, updatedData) {
  try {
    let projects = (await get('projects')) || [];
    const index = projects.findIndex(proj => proj.id === id);

    if (index === -1) {
      throw new Error('Project not found');
    }

    projects[index] = { ...projects[index], ...updatedData };
    await patchEdgeConfig('projects', projects);

    return projects[index];
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }
}

router.put('/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, imageUrl, projectUrl } = req.body;

  if (!title || !description || !imageUrl || !projectUrl) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await updateProject(id, { title, description, imageUrl, projectUrl });
    res.status(200).json({ message: 'Proje bilgisi güncellendi' });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({
      message: `Sunucu hatası: ${error.message}`,
      requestBody: req.body,
    });
  }
});

module.exports = router;