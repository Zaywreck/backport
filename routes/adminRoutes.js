const express = require('express');
const { get } = require('@vercel/edge-config');

const router = express.Router();

const EDGE_CONFIG_URL = 'https://api.vercel.com/v1/edge-config/ecfg_r5ttjeq5fpdwcyl7muoowf83nad1/items';
const API_TOKEN = 'Bearer 58W6mvFK9bVdAHyxRzAr0Aql';

// Helper function to update Edge Config
async function patchEdgeConfig(items) {
  try {
    const response = await fetch(EDGE_CONFIG_URL, {
      method: 'PATCH',
      headers: {
        Authorization: API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Edge Config update failed: ${result.message || 'Unknown error'}`);
    }
    console.log('Patch result:', result);
    return result;
  } catch (error) {
    console.error('Error patching Edge Config:', error);
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
    const newId = experiences.length + 1; // ID = index + 1

    const newExperience = {
      id: newId,
      title,
      company,
      start_date,
      end_date,
      description,
    };

    // Yeni bir öğe eklemek için 'create' operasyonu
    await patchEdgeConfig([
      {
        operation: 'create',
        key: `experiences_${newId}`, // Her öğe için benzersiz bir key
        value: newExperience,
      },
    ]);

    res.status(201).json(newExperience);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Experience Bilgisi Silme
router.delete('/experience/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const experiences = (await get('experiences')) || [];
    const exists = experiences.some(exp => exp.id === Number(id));

    if (!exists) {
      return res.status(404).json({ message: 'Deneyim bulunamadı' });
    }

    // Öğeyi silmek için 'delete' operasyonu
    await patchEdgeConfig([
      {
        operation: 'delete',
        key: `experiences_${id}`,
      },
    ]);

    res.status(200).json({ message: 'Deneyim bilgisi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Experience Güncelleme
async function updateExperience(id, updatedData) {
  try {
    const experiences = (await get('experiences')) || [];
    const index = experiences.findIndex(exp => exp.id === Number(id));

    if (index === -1) {
      throw new Error('Experience not found');
    }

    const updatedExperience = { ...experiences[index], ...updatedData };

    await patchEdgeConfig([
      {
        operation: 'update',
        key: `experiences_${id}`,
        value: updatedExperience,
      },
    ]);

    return updatedExperience;
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
    await updateExperience(Number(id), { title, company, start_date, end_date, description });
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
    const education = (await get('education')) || [];
    const newId = education.length + 1; // ID = index + 1

    const newEducation = {
      id: newId,
      school,
      degree,
      field,
      startDate,
      endDate,
      description,
    };

    await patchEdgeConfig([
      {
        operation: 'create',
        key: `education_${newId}`,
        value: newEducation,
      },
    ]);

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
    const education = (await get('education')) || [];
    const exists = education.some(edu => edu.id === Number(id));

    if (!exists) {
      return res.status(404).json({ message: 'Eğitim bulunamadı' });
    }

    await patchEdgeConfig([
      {
        operation: 'delete',
        key: `education_${id}`,
      },
    ]);

    res.status(200).json({ message: 'Eğitim bilgisi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Education Güncelleme
async function updateEducation(id, updatedData) {
  try {
    const education = (await get('education')) || [];
    const index = education.findIndex(edu => edu.id === Number(id));

    if (index === -1) {
      throw new Error('Education not found');
    }

    const updatedEducation = { ...education[index], ...updatedData };

    await patchEdgeConfig([
      {
        operation: 'update',
        key: `education_${id}`,
        value: updatedEducation,
      },
    ]);

    return updatedEducation;
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
    await updateEducation(Number(id), { school, degree, field, startDate, endDate, description });
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
    const projects = (await get('projects')) || [];
    const newId = projects.length + 1; // ID = index + 1

    const newProject = {
      id: newId,
      title,
      description,
      imageUrl,
      projectUrl,
    };

    await patchEdgeConfig([
      {
        operation: 'create',
        key: `projects_${newId}`,
        value: newProject,
      },
    ]);

    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Project Bilgisi Silme
router.delete('/projects/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const projects = (await get('projects')) || [];
    const exists = projects.some(proj => proj.id === Number(id));

    if (!exists) {
      return res.status(404).json({ message: 'Proje bulunamadı' });
    }

    await patchEdgeConfig([
      {
        operation: 'delete',
        key: `projects_${id}`,
      },
    ]);

    res.status(200).json({ message: 'Proje silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Project Güncelleme
async function updateProject(id, updatedData) {
  try {
    const projects = (await get('projects')) || [];
    const index = projects.findIndex(proj => proj.id === Number(id));

    if (index === -1) {
      throw new Error('Project not found');
    }

    const updatedProject = { ...projects[index], ...updatedData };

    await patchEdgeConfig([
      {
        operation: 'update',
        key: `projects_${id}`,
        value: updatedProject,
      },
    ]);

    return updatedProject;
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
    await updateProject(Number(id), { title, description, imageUrl, projectUrl });
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