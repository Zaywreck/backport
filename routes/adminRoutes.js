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
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

// Yeni Experience Bilgisi Ekle
router.post('/experience', async (req, res) => {
  const { title, company, startDate, endDate, description } = req.body;

  try {
    let experiences = (await get('experiences')) || [];
    const newId = experiences.length > 0 ? Math.max(...experiences.map(exp => exp.id)) + 1 : 1;

    const newExperience = {
      id: newId,
      title,
      company,
      startDate,
      endDate,
      description,
    };

    experiences.push(newExperience);
    await set('experiences', experiences);

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
    const filteredExperiences = experiences.filter(exp => exp.id !== Number(id));

    if (filteredExperiences.length === experiences.length) {
      return res.status(404).json({ message: 'Deneyim bulunamadı' });
    }

    await set('experiences', filteredExperiences);
    res.status(200).json({ message: 'Deneyim bilgisi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

async function updateExperience(id, updatedData) {
  const experiences = await get('experiences') || [];
  const index = experiences.findIndex(exp => exp.id === id);

  if (index === -1) {
    throw new Error('Deneyim bulunamadı');
  }

  experiences[index] = { ...experiences[index], ...updatedData };
  await set('experiences', experiences);
}

router.put('/experience/:id', async (req, res) => {
  const { id } = req.params;
  const { title, company, startDate, endDate, description } = req.body;

  try {
    // Call to the updateExperience function (assume it's defined elsewhere)
    const updateResult = await updateExperience(Number(id), { title, company, startDate, endDate, description });

    // If no experience was updated (e.g., not found), handle that case.
    if (!updateResult) {
      return res.status(404).json({ message: 'Deneyim bulunamadı' });
    }

    res.status(200).json({ message: 'Deneyim bilgisi güncellendi' });
  } catch (error) {
    // Improved error logging
    console.error('Error details:', error); // Log full error for debugging
    res.status(500).json({
      message: `Sunucu hatası: ${error.message}`,
      // Optional: You can log the request body for further debugging if needed
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


router.post('/education', async (req, res) => {
  const { school, degree, field, startDate, endDate, description } = req.body;

  try {
    // Eğitim bilgilerini alıyoruz
    const education = (await get('education')) || [];

    // Yeni eğitim bilgisi
    const newEducation = {
      id: education.length + 1,
      school,
      degree,
      field,
      startDate,
      endDate,
      description,
    };

    // Eğitim verisini güncelleme
    const updatedEducation = [...education, newEducation];

    // Yeni veriyi kaydediyoruz
    await set('education', updatedEducation);

    // Başarıyla eklenen eğitim bilgisini döndürüyoruz
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
    const filteredEducation = education.filter(edu => edu.id !== Number(id));

    if (filteredEducation.length === education.length) {
      return res.status(404).json({ message: 'Eğitim bulunamadı' });
    }

    await set('education', filteredEducation);
    res.status(200).json({ message: 'Eğitim bilgisi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});
// Eğitim güncelleme
router.put('/education/:id', async (req, res) => {
  const { id } = req.params;
  const { school, degree, field, startDate, endDate, description } = req.body;

  try {
    let education = (await get('education')) || [];
    const index = education.findIndex(edu => edu.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ message: 'Eğitim bulunamadı' });
    }

    education[index] = { ...education[index], school, degree, field, startDate, endDate, description };
    await set('education', education);

    res.status(200).json({ message: 'Eğitim bilgisi güncellendi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
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
    const newId = projects.length > 0 ? Math.max(...projects.map(proj => proj.id)) + 1 : 1;

    const newProject = {
      id: newId,
      title,
      description,
      imageUrl,
      projectUrl,
    };

    projects.push(newProject);
    await set('projects', projects);

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
    const filteredProjects = projects.filter(proj => proj.id !== Number(id));

    if (filteredProjects.length === projects.length) {
      return res.status(404).json({ message: 'Proje bulunamadı' });
    }

    await set('projects', filteredProjects);
    res.status(200).json({ message: 'Proje silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});
// Project güncelleme
router.put('/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, imageUrl, projectUrl } = req.body;

  try {
    let projects = (await get('projects')) || [];
    const index = projects.findIndex(proj => proj.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ message: 'Proje bulunamadı' });
    }

    projects[index] = { ...projects[index], title, description, imageUrl, projectUrl };
    await set('projects', projects);

    res.status(200).json({ message: 'Proje bilgisi güncellendi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
});

module.exports = router;
