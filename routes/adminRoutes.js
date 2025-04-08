const express = require('express');
const { get } = require('@vercel/edge-config');

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
  const { title, company, start_date, end_date, description } = req.body;

  try {
    let experiences = (await get('experiences')) || [];
    const newId = experiences.length > 0 ? Math.max(...experiences.map(exp => exp.id)) + 1 : 1;

    const newExperience = {
      id: newId,
      title,
      company,
      start_date,
      end_date,
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
  try {
    // Fetch current experiences from Vercel Edge Config
    const experiencesJson = await get('experiences');
    
    // Parse experiences if it's a string
    const experiences = typeof experiencesJson === 'string' ? JSON.parse(experiencesJson) : experiencesJson;

    // If experiences is not an array, initialize it as an empty array
    if (!Array.isArray(experiences)) {
      throw new Error('Experiences data is not an array');
    }

    // Find the experience index by matching the ID
    const index = experiences.findIndex(experience => experience.id === id.toString());

    if (index === -1) {
      throw new Error('Experience not found');
    }

    // Update the experience at the specified index with the new data
    experiences[index] = { ...experiences[index], ...updatedData };

    // Now update Edge Config using Vercel API (PATCH)
    const response = await fetch(
      'https://api.vercel.com/v1/edge-config/ecfg_r5ttjeq5fpdwcyl7muoowf83nad1/items',
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer 58W6mvFK9bVdAHyxRzAr0Aql`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'update',
              key: 'experiences',
              value: experiences, // Update experiences data
            },
          ],
        }),
      }
    );

    const result = await response.json();
    console.log('Updated experiences:', result);

    return result; // Return the result of the update

  } catch (error) {
    console.error('Error updating experience:', error);
    throw new Error('Failed to update experience');
  }
}



// PUT endpoint to update an experience
router.put('/experience/:id', async (req, res) => {
  const { id } = req.params;
  const { title, company, start_date, end_date, description } = req.body;

  if (!title || !company || !start_date || !description) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Update the experience with the given ID and updated data
    await updateExperience(Number(id), { title, company, start_date, end_date, description });

    res.status(200).json({ message: 'Experience updated successfully' });
  } catch (error) {
    console.error('Error details:', error); // Log full error for debugging
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
