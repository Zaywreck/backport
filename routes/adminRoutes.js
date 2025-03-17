const express = require('express');
const { get, set } = require('@vercel/edge-config');

const router = express.Router();

// ===================== Experience =====================

// Experience Bilgilerini Listele
router.get('/experience', async (req, res) => {
  try {
    const experiences = (await get('experiences')) || [];
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error });
  }
});

// Yeni Experience Bilgisi Ekle
router.post('/experience', async (req, res) => {
  const { title, company, startDate, endDate, description } = req.body;

  try {
    const experiences = (await get('experiences')) || [];
    const newExperience = {
      id: experiences.length + 1,
      title,
      company,
      startDate,
      endDate,
      description,
    };

    const updatedExperiences = [...experiences, newExperience];
    await set('experiences', updatedExperiences);

    res.status(201).json(newExperience);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error });
  }
});

// Experience Bilgisi Silme
router.delete('/experience/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let experiences = (await get('experiences')) || [];
    experiences = experiences.filter(exp => exp.id !== Number(id));

    await set('experiences', experiences);
    res.status(200).json({ message: 'Deneyim bilgisi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error });
  }
});

// ===================== Education =====================

// Education Bilgilerini Listele
router.get('/education', async (req, res) => {
  try {
    const education = (await get('education')) || [];
    res.json(education);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error });
  }
});

// Yeni Education Bilgisi Ekle
router.post('/education', async (req, res) => {
  const { school, degree, field, startDate, endDate, description } = req.body;

  try {
    const education = (await get('education')) || [];
    const newEducation = {
      id: education.length + 1,
      school,
      degree,
      field,
      startDate,
      endDate,
      description,
    };

    const updatedEducation = [...education, newEducation];
    await set('education', updatedEducation);

    res.status(201).json(newEducation);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error });
  }
});

// Education Bilgisi Silme

router.delete('/education/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let education = (await get('education')) || [];
    education = education.filter(edu => edu.id !== Number(id));

    await set('education', education);
    res.status(200).json({ message: 'Eğitim bilgisi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error });
  }
}
);

// ===================== Projects =====================

// Projects Bilgilerini Listele
router.get('/projects', async (req, res) => {
  try {
    const projects = (await get('projects')) || [];
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error });
  }
});

// Yeni Project Bilgisi Ekle
router.post('/projects', async (req, res) => {
  const { title, description, imageUrl, projectUrl } = req.body;

  try {
    const projects = (await get('projects')) || [];
    const newProject = {
      id: projects.length + 1,
      title,
      description,
      imageUrl,
      projectUrl,
    };

    const updatedProjects = [...projects, newProject];
    await set('projects', updatedProjects);

    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error });
  }
});

// Project Bilgisi Silme

router.delete('/projects/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let projects = (await get('projects')) || [];
    projects = projects.filter(proj => proj.id !== Number(id));

    await set('projects', projects);
    res.status(200).json({ message: 'Proje silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error });
  }
}
);

module.exports = router;
