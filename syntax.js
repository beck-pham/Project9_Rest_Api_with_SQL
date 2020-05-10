const fs = require('fs');

function generateRandomId(){
  return Math.floor(Math.random() * 10000);
}

function save(data){
  return new Promise((resolve, reject) => {
    fs.writeFile('data.json', JSON.stringify(data, null, 2), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Gets all courses
 * @param None
 */
function getCourses(){
  return new Promise((resolve, reject) => {
    fs.readFile('data.json', 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        const json = JSON.parse(data);
        resolve(json);
      }
    });
  });
}

/**
 * Gets a specific course by ID
 * @param {number} id - Accepts the ID of the specified course.
 */
async function getCourse(id){
  const courses = await getCourses();
  return courses.courses.find(course => course.userId == id);
}
/**
 * Gets a random course 
 * @param None
 */
async function getRandomCourse(){
  const courses = await getCourses();
  const randNum = Math.floor(Math.random() * courses.courses.length);
  return courses.courses[randNum];
}

/**
 * Creates a new course record 
 * @param {Object} newCourse - Object containing info for new course: the course title and description 
 */
async function createCourse(newCourse) {
  const courses = await getCourses(); 
  
  newCourse.id = generateRandomId(); 
  courses.courses.push(newCourse);
  await save(courses); 
  return newCourse; 
}

/**
 * Updates a single course 
 * @param {Object} newCourse - An object containing the changes to the course title and description 
 */
async function updateCourse(newCourse){
  const courses = await getCourses();
  let course = courses.courses.find(item => item.userId == newCourse.id);
  
  course.title = newCourse.title;
  course.description = newCourse.description;
 
  await save(courses);
}

/**
 * Deletes a single record
 * @param {Object} course - Accepts record to be deleted. 
 */
async function deleteCourse(course){
  const courses = await getCourses();
  courses.courses = courses.courses.filter(item => item.userId != course.id);
  await save(courses);
}

module.exports = {
  getCourses,
  getCourse, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  getRandomCourse
}
